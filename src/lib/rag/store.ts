import fs from 'node:fs';
import path from 'node:path';
import type { IndexManifest, IndexedChunk } from './types';
import { EMBED_DIMENSIONS } from './embed';

/**
 * On-disk vector store.
 *
 * Two files: a JSON manifest with the chunk metadata, and the embedding matrix
 * packed as raw little-endian float32. At this corpus size a brute-force scan
 * over a contiguous Float32Array is well under a millisecond, so an ANN index
 * would be complexity without benefit — and it keeps the store dependency-free
 * and trivially diffable in review.
 */

export const INDEX_DIR = path.join(process.cwd(), 'data', 'rag');
const MANIFEST_PATH = path.join(INDEX_DIR, 'index.json');
const VECTORS_PATH = path.join(INDEX_DIR, 'vectors.bin');

export interface LoadedIndex {
  manifest: IndexManifest;
  /** Row-major [chunkCount x dimensions]. */
  matrix: Float32Array;
  chunks: IndexedChunk[];
}

export function indexExists(): boolean {
  return fs.existsSync(MANIFEST_PATH) && fs.existsSync(VECTORS_PATH);
}

export function writeIndex(manifest: IndexManifest, vectors: Float32Array[]): void {
  fs.mkdirSync(INDEX_DIR, { recursive: true });
  const packed = new Float32Array(vectors.length * manifest.dimensions);
  vectors.forEach((v, i) => packed.set(v, i * manifest.dimensions));
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest));
  fs.writeFileSync(VECTORS_PATH, Buffer.from(packed.buffer, packed.byteOffset, packed.byteLength));
}

let cached: LoadedIndex | null = null;

/** Load and memoise the index. Returns null when it has not been built. */
export function loadIndex(): LoadedIndex | null {
  if (cached) return cached;
  if (!indexExists()) return null;

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8')) as IndexManifest;
  const buf = fs.readFileSync(VECTORS_PATH);
  // Copy rather than view the Buffer: Node pools small allocations, so the
  // underlying ArrayBuffer may be shared and mis-offset.
  const matrix = new Float32Array(buf.byteLength / 4);
  for (let i = 0; i < matrix.length; i++) matrix[i] = buf.readFloatLE(i * 4);

  const expected = manifest.chunkCount * manifest.dimensions;
  if (matrix.length !== expected) {
    throw new Error(`rag index corrupt: expected ${expected} floats, found ${matrix.length}`);
  }
  if (manifest.dimensions !== EMBED_DIMENSIONS) {
    throw new Error(
      `rag index built with ${manifest.dimensions} dimensions but the model produces ${EMBED_DIMENSIONS}; rebuild it`,
    );
  }

  cached = { manifest, matrix, chunks: manifest.chunks };
  return cached;
}

/** Read one row out of the packed matrix without copying the whole thing. */
export function vectorAt(index: LoadedIndex, row: number): Float32Array {
  const d = index.manifest.dimensions;
  return index.matrix.subarray(row * d, row * d + d);
}

/** Drop the memoised index — used by the build script after rewriting files. */
export function clearIndexCache(): void {
  cached = null;
}
