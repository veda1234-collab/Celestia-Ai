/** Shared types for the local retrieval-augmented generation layer. */

export interface CorpusDoc {
  /** Stable id derived from the file name. */
  id: string;
  title: string;
  /** Broad area, e.g. "grahas", "bhavas", "dasha". Used to bias retrieval. */
  topic: string;
  /** Where the text came from, shown to the user as a citation. */
  source: string;
  text: string;
}

export interface Chunk {
  id: string;
  docId: string;
  title: string;
  topic: string;
  source: string;
  /** The heading path this chunk sits under, e.g. "Saturn > Remedies". */
  heading: string;
  text: string;
  /** Lowercased tokens, cached for lexical scoring. */
  tokens: string[];
}

export interface IndexedChunk extends Chunk {
  /** Row offset into the packed embedding matrix. */
  vectorIndex: number;
}

/** On-disk shape of the built index (vectors are stored alongside, packed). */
export interface IndexManifest {
  model: string;
  dimensions: number;
  builtAtISO: string;
  chunkCount: number;
  chunks: IndexedChunk[];
}

export interface RetrievedPassage {
  chunk: Chunk;
  /** Fused rank score — comparable within one query only. */
  score: number;
  /** Which retrievers surfaced it, for explainability. */
  matchedBy: ('vector' | 'lexical')[];
}
