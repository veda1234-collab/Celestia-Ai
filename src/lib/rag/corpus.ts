import fs from 'node:fs';
import path from 'node:path';
import type { CorpusDoc } from './types';

/**
 * Corpus loading.
 *
 * Two sources, both local:
 *  - the bundled reference corpus under `src/lib/rag/corpus`, authored for this
 *    app so there is no question of redistributing copyrighted translations;
 *  - anything the user drops into `data/rag/sources`, which is how their own
 *    notes or openly-licensed texts get in.
 *
 * Deliberately no scraping. Most English translations of the classical texts
 * are under copyright even where the Sanskrit original is not.
 */

const BUILTIN_DIR = path.join(process.cwd(), 'src', 'lib', 'rag', 'corpus');
export const USER_SOURCES_DIR = path.join(process.cwd(), 'data', 'rag', 'sources');

/** Parse the leading `---` YAML-ish block. Only flat `key: value` is supported. */
function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(raw);
  if (!match) return { meta: {}, body: raw };

  const meta: Record<string, string> = {};
  for (const line of match[1]!.split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    if (key) meta[key] = value;
  }
  return { meta, body: raw.slice(match[0].length) };
}

function readDir(dir: string, defaultSource: string): CorpusDoc[] {
  if (!fs.existsSync(dir)) return [];
  const docs: CorpusDoc[] = [];

  for (const file of fs.readdirSync(dir).sort()) {
    if (!/\.(md|markdown|txt)$/i.test(file)) continue;
    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    const { meta, body } = parseFrontmatter(raw);
    const id = file.replace(/\.[^.]+$/, '');
    if (!body.trim()) continue;

    docs.push({
      id,
      title: meta.title || id.replace(/[-_]/g, ' '),
      topic: meta.topic || 'general',
      source: meta.source || defaultSource,
      text: body,
    });
  }
  return docs;
}

export function loadCorpus(): CorpusDoc[] {
  return [
    ...readDir(BUILTIN_DIR, 'Vedastra reference'),
    ...readDir(USER_SOURCES_DIR, 'User-provided document'),
  ];
}
