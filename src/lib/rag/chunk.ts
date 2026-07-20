import type { Chunk, CorpusDoc } from './types';
import { tokenize } from './glossary';

/**
 * Heading-aware chunker.
 *
 * Reference material is highly structured — "Saturn > Remedies" is a different
 * retrieval target from "Saturn > Significations" — so chunks are cut on
 * markdown headings first and only split further when a section is genuinely
 * long. Each chunk carries its heading path, which is prepended to the embedded
 * text so a passage retrieved in isolation still says what it is about.
 */

const TARGET_CHARS = 900;
const OVERLAP_CHARS = 140;
const MIN_CHARS = 60;

interface Section {
  heading: string;
  body: string;
}

/** Split markdown into sections keyed by their heading path. */
function splitByHeadings(text: string): Section[] {
  const lines = text.split('\n');
  const sections: Section[] = [];
  const path: string[] = [];
  let buffer: string[] = [];

  const flush = () => {
    const body = buffer.join('\n').trim();
    if (body) sections.push({ heading: path.join(' > '), body });
    buffer = [];
  };

  for (const line of lines) {
    const m = /^(#{1,6})\s+(.*)$/.exec(line);
    if (m) {
      flush();
      const depth = m[1]!.length;
      path.length = Math.max(0, depth - 1);
      path[depth - 1] = m[2]!.trim();
      path.length = depth;
    } else {
      buffer.push(line);
    }
  }
  flush();
  return sections;
}

/** Split a long body on paragraph boundaries, with a little overlap. */
function splitLong(body: string): string[] {
  if (body.length <= TARGET_CHARS) return [body];

  const paragraphs = body.split(/\n{2,}/);
  const out: string[] = [];
  let current = '';

  for (const p of paragraphs) {
    if (current && current.length + p.length + 2 > TARGET_CHARS) {
      out.push(current.trim());
      // Carry the tail of the previous chunk so a fact split across the seam is
      // still retrievable from either side.
      current = `${current.slice(-OVERLAP_CHARS)}\n\n${p}`;
    } else {
      current = current ? `${current}\n\n${p}` : p;
    }
  }
  if (current.trim()) out.push(current.trim());

  // A single paragraph longer than the target still needs cutting.
  return out.flatMap((piece) => {
    if (piece.length <= TARGET_CHARS * 1.6) return [piece];
    const hard: string[] = [];
    for (let i = 0; i < piece.length; i += TARGET_CHARS - OVERLAP_CHARS) {
      hard.push(piece.slice(i, i + TARGET_CHARS));
    }
    return hard;
  });
}

export function chunkDocument(doc: CorpusDoc): Chunk[] {
  const chunks: Chunk[] = [];
  let n = 0;

  for (const section of splitByHeadings(doc.text)) {
    for (const piece of splitLong(section.body)) {
      const body = piece.trim();
      if (body.length < MIN_CHARS) continue;
      const heading = section.heading || doc.title;
      chunks.push({
        id: `${doc.id}#${n++}`,
        docId: doc.id,
        title: doc.title,
        topic: doc.topic,
        source: doc.source,
        heading,
        text: body,
        tokens: tokenize(`${doc.title} ${heading} ${body}`),
      });
    }
  }
  return chunks;
}

/**
 * The string actually handed to the embedding model: title and heading give the
 * passage context it would otherwise lose when read out of order.
 */
export function embeddingTextFor(chunk: Chunk): string {
  return `${chunk.title} — ${chunk.heading}\n${chunk.text}`;
}
