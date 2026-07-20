/**
 * Local sentence embeddings via transformers.js.
 *
 * Deliberately keyless: the model runs in-process on ONNX runtime, matching the
 * app's zero-config posture (the whole thing works offline once the ~25 MB
 * model is cached under node_modules/.cache).
 */

export const EMBED_MODEL = 'Xenova/all-MiniLM-L6-v2';
export const EMBED_DIMENSIONS = 384;

type Extractor = (
  texts: string[],
  opts: { pooling: 'mean'; normalize: boolean },
) => Promise<{ tolist: () => number[][] }>;

let extractorPromise: Promise<Extractor> | null = null;

type ExtractorFactory = () => Promise<Extractor>;
let injectedFactory: ExtractorFactory | null = null;

/**
 * Supply the model loader from outside.
 *
 * The default path below uses a dynamic import, which is what keeps the ONNX
 * runtime out of the Next bundle for routes that never embed anything. That is
 * right for the server but breaks under tsx, whose resolver mishandles a
 * dynamic import of a scoped package from a path-aliased module. Build scripts
 * therefore import the library statically and inject it here.
 */
export function setExtractorFactory(factory: ExtractorFactory | null): void {
  injectedFactory = factory;
  extractorPromise = null;
}

/** Load the model once per process. */
export function getExtractor(): Promise<Extractor> {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      if (injectedFactory) return injectedFactory();
      const { pipeline } = await import('@huggingface/transformers');
      return (await pipeline('feature-extraction', EMBED_MODEL)) as unknown as Extractor;
    })().catch((err) => {
      // Let a later call retry rather than caching the failure forever.
      extractorPromise = null;
      throw err;
    });
  }
  return extractorPromise;
}

/**
 * Embed texts into unit-length vectors. Batched, because the model call has
 * meaningful fixed overhead and indexing runs over hundreds of chunks.
 */
export async function embed(texts: string[], batchSize = 32): Promise<Float32Array[]> {
  if (!texts.length) return [];
  const extractor = await getExtractor();
  const out: Float32Array[] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const tensor = await extractor(batch, { pooling: 'mean', normalize: true });
    for (const row of tensor.tolist()) out.push(Float32Array.from(row));
  }
  return out;
}

export async function embedOne(text: string): Promise<Float32Array> {
  const [v] = await embed([text]);
  if (!v) throw new Error('embedding failed to produce a vector');
  return v;
}

/** Vectors are normalised at source, so the dot product is the cosine. */
export function cosine(a: Float32Array, b: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i]! * b[i]!;
  return sum;
}
