/**
 * Build the local RAG index.
 *
 *   pnpm rag:build
 *
 * Chunks the corpus, embeds every chunk with the local model, and writes the
 * manifest plus a packed float32 matrix into `data/rag`. Safe to re-run; it
 * rewrites the index from scratch.
 */

import { pipeline } from '@huggingface/transformers';
import { chunkDocument, embeddingTextFor } from '@/lib/rag/chunk';
import { loadCorpus, USER_SOURCES_DIR } from '@/lib/rag/corpus';
import { EMBED_DIMENSIONS, EMBED_MODEL, embed, setExtractorFactory } from '@/lib/rag/embed';
import { expandWithGlossary } from '@/lib/rag/glossary';
import { clearIndexCache, INDEX_DIR, writeIndex } from '@/lib/rag/store';
import type { Chunk, IndexedChunk } from '@/lib/rag/types';

// Static import injected into the embed layer — see setExtractorFactory for why
// the dynamic import the server uses cannot be used from a tsx script.
setExtractorFactory(async () =>
  (await pipeline('feature-extraction', EMBED_MODEL)) as never,
);

const t0 = Date.now();

const docs = loadCorpus();
if (!docs.length) {
  console.error(`No corpus documents found. Add markdown to ${USER_SOURCES_DIR} or the bundled corpus.`);
  process.exit(1);
}

const chunks: Chunk[] = docs.flatMap(chunkDocument);
console.log(`corpus: ${docs.length} documents → ${chunks.length} chunks`);

// The glossary is applied to the embedded text, not the stored text: the model
// gets English handles for Sanskrit terms, while what we later show the user
// stays exactly as written.
const texts = chunks.map((c) => expandWithGlossary(embeddingTextFor(c)));

console.log(`embedding with ${EMBED_MODEL} …`);
const vectors = await embed(texts);

if (vectors.length !== chunks.length) {
  throw new Error(`embedding count mismatch: ${vectors.length} vectors for ${chunks.length} chunks`);
}
for (const v of vectors) {
  if (v.length !== EMBED_DIMENSIONS) {
    throw new Error(`unexpected embedding width ${v.length}, expected ${EMBED_DIMENSIONS}`);
  }
}

const indexed: IndexedChunk[] = chunks.map((c, i) => ({ ...c, vectorIndex: i }));

writeIndex(
  {
    model: EMBED_MODEL,
    dimensions: EMBED_DIMENSIONS,
    builtAtISO: new Date().toISOString(),
    chunkCount: indexed.length,
    chunks: indexed,
  },
  vectors,
);
clearIndexCache();

const byTopic = new Map<string, number>();
for (const c of chunks) byTopic.set(c.topic, (byTopic.get(c.topic) ?? 0) + 1);

console.log(`\nwrote index to ${INDEX_DIR}`);
console.log(`  chunks     ${indexed.length}`);
console.log(`  dimensions ${EMBED_DIMENSIONS}`);
console.log(`  topics     ${[...byTopic].map(([t, n]) => `${t}(${n})`).join(', ')}`);
console.log(`  elapsed    ${((Date.now() - t0) / 1000).toFixed(1)}s`);
