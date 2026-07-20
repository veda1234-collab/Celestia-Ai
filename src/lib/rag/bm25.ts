import type { Chunk } from './types';

/**
 * Okapi BM25 lexical index.
 *
 * The dense retriever cannot see Sanskrit vocabulary (measured: "Shani" vs
 * "Saturn" embeds at 0.139), so exact term matching is not a nice-to-have here
 * — it is the half of the system that actually finds "vargottama", "Sāḍe Sātī"
 * or a specific nakshatra name.
 */

const K1 = 1.5;
const B = 0.75;

export class Bm25Index {
  private readonly docFreq = new Map<string, number>();
  private readonly lengths: number[] = [];
  private avgLength = 0;
  private readonly postings = new Map<string, Map<number, number>>();

  constructor(private readonly chunks: Chunk[]) {
    chunks.forEach((chunk, i) => {
      this.lengths[i] = chunk.tokens.length;
      const seen = new Set<string>();
      for (const token of chunk.tokens) {
        const posting = this.postings.get(token) ?? new Map<number, number>();
        posting.set(i, (posting.get(i) ?? 0) + 1);
        this.postings.set(token, posting);
        seen.add(token);
      }
      for (const token of seen) this.docFreq.set(token, (this.docFreq.get(token) ?? 0) + 1);
    });
    const total = this.lengths.reduce((s, n) => s + n, 0);
    this.avgLength = this.lengths.length ? total / this.lengths.length : 0;
  }

  /** Score every chunk against the query terms; returns non-zero hits only. */
  search(queryTokens: string[], limit: number): { index: number; score: number }[] {
    const N = this.chunks.length;
    const scores = new Map<number, number>();

    for (const token of new Set(queryTokens)) {
      const posting = this.postings.get(token);
      if (!posting) continue;
      const df = this.docFreq.get(token) ?? 1;
      // BM25's probabilistic IDF, floored so very common terms cannot go negative.
      const idf = Math.max(0.01, Math.log(1 + (N - df + 0.5) / (df + 0.5)));

      for (const [docIndex, tf] of posting) {
        const len = this.lengths[docIndex] || 1;
        const denom = tf + K1 * (1 - B + (B * len) / (this.avgLength || 1));
        scores.set(docIndex, (scores.get(docIndex) ?? 0) + idf * ((tf * (K1 + 1)) / denom));
      }
    }

    return [...scores.entries()]
      .map(([index, score]) => ({ index, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}
