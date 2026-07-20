import type { RetrievedPassage } from './types';
import { Bm25Index } from './bm25';
import { cosine, embedOne } from './embed';
import { expandWithGlossary, tokenize } from './glossary';
import { loadIndex, vectorAt, type LoadedIndex } from './store';

/**
 * Hybrid retrieval: dense vectors for paraphrase, BM25 for exact domain terms,
 * fused with Reciprocal Rank Fusion.
 *
 * RRF is used rather than a weighted score blend because the two scales are not
 * comparable — cosine sits in [-1, 1] while BM25 is unbounded and corpus
 * dependent. Fusing on *rank* sidesteps having to calibrate them against each
 * other, and degrades gracefully when one retriever returns nothing.
 */

/** Standard RRF damping; larger values flatten the contribution of top ranks. */
const RRF_K = 60;
const CANDIDATES = 40;

let bm25: Bm25Index | null = null;
let bm25For: LoadedIndex | null = null;

function lexicalIndex(index: LoadedIndex): Bm25Index {
  if (!bm25 || bm25For !== index) {
    bm25 = new Bm25Index(index.chunks);
    bm25For = index;
  }
  return bm25;
}

export interface RetrieveOptions {
  /** How many passages to return. */
  limit?: number;
  /** Drop fused results below this rank score. */
  minScore?: number;
  /** At most this many passages from any one document, to keep answers broad. */
  perDocLimit?: number;
}

export interface RetrieveResult {
  passages: RetrievedPassage[];
  /** False when the index has not been built — callers should degrade quietly. */
  available: boolean;
}

/**
 * Retrieve passages relevant to a question. Never throws: a failure here should
 * cost the answer its citations, not the answer itself.
 */
export async function retrieve(query: string, opts: RetrieveOptions = {}): Promise<RetrieveResult> {
  const limit = opts.limit ?? 6;
  const perDocLimit = opts.perDocLimit ?? 3;

  let index: LoadedIndex | null = null;
  try {
    index = loadIndex();
  } catch (err) {
    console.error('rag index failed to load', err);
    return { passages: [], available: false };
  }
  if (!index || !index.chunks.length) return { passages: [], available: false };

  // Glossary expansion gives the dense model English handles for Sanskrit terms
  // and gives BM25 extra surface to match on.
  const expanded = expandWithGlossary(query);

  const ranks = new Map<number, { rrf: number; matchedBy: Set<'vector' | 'lexical'> }>();
  const addRank = (docIndex: number, rank: number, by: 'vector' | 'lexical') => {
    const entry = ranks.get(docIndex) ?? { rrf: 0, matchedBy: new Set<'vector' | 'lexical'>() };
    entry.rrf += 1 / (RRF_K + rank + 1);
    entry.matchedBy.add(by);
    ranks.set(docIndex, entry);
  };

  // Lexical leg — cheap, and the only leg that reliably catches Sanskrit terms.
  try {
    const hits = lexicalIndex(index).search(tokenize(expanded), CANDIDATES);
    hits.forEach((h, rank) => addRank(h.index, rank, 'lexical'));
  } catch (err) {
    console.error('rag lexical retrieval failed', err);
  }

  // Dense leg — may be unavailable if the model cannot load (e.g. offline on a
  // cold cache); the lexical results still stand on their own.
  try {
    const qv = await embedOne(expanded);
    const scored: { index: number; score: number }[] = [];
    for (let i = 0; i < index.chunks.length; i++) {
      scored.push({ index: i, score: cosine(qv, vectorAt(index, i)) });
    }
    scored.sort((a, b) => b.score - a.score);
    scored.slice(0, CANDIDATES).forEach((h, rank) => addRank(h.index, rank, 'vector'));
  } catch (err) {
    console.error('rag dense retrieval unavailable; using lexical only', err);
  }

  const ordered = [...ranks.entries()]
    .map(([docIndex, v]) => ({ docIndex, score: v.rrf, matchedBy: [...v.matchedBy] }))
    .sort((a, b) => b.score - a.score);

  // Spread results across documents so one long article cannot crowd out the rest.
  const perDoc = new Map<string, number>();
  const passages: RetrievedPassage[] = [];
  for (const item of ordered) {
    if (opts.minScore != null && item.score < opts.minScore) break;
    const chunk = index.chunks[item.docIndex]!;
    const used = perDoc.get(chunk.docId) ?? 0;
    if (used >= perDocLimit) continue;
    perDoc.set(chunk.docId, used + 1);
    passages.push({ chunk, score: item.score, matchedBy: item.matchedBy });
    if (passages.length >= limit) break;
  }

  return { passages, available: true };
}
