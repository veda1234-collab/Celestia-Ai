/**
 * Retrieval smoke-eval.
 *
 *   pnpm rag:eval
 *
 * Each case names a query and the topic its answer should come from. Sanskrit
 * queries are included deliberately: the dense model scores "Shani" against
 * "Saturn" at 0.139, so these are exactly the cases hybrid retrieval exists to
 * rescue, and a regression here means the lexical leg or the glossary broke.
 */

import { pipeline } from '@huggingface/transformers';
import { EMBED_MODEL, setExtractorFactory } from '@/lib/rag/embed';
import { retrieve } from '@/lib/rag/retrieve';

setExtractorFactory(async () => (await pipeline('feature-extraction', EMBED_MODEL)) as never);

const CASES: { q: string; expect: string; note?: string }[] = [
  { q: 'what is sade sati and how long does it last', expect: 'gochar' },
  { q: 'shani ki dasha kaisi hoti hai', expect: 'dasha', note: 'transliterated Hindi' },
  { q: 'when will I get married', expect: 'bhavas' },
  { q: 'what does vargottama mean', expect: 'vargas' },
  { q: 'is manglik dosha a problem for marriage', expect: 'yogas' },
  { q: 'which gemstone should I wear for Saturn', expect: 'remedies' },
  { q: 'what is my birth star Rohini like', expect: 'nakshatras' },
  { q: 'meaning of the tenth house karma bhava', expect: 'bhavas' },
  { q: 'how do I know if a raja yoga will actually work', expect: 'yogas' },
  { q: 'what does Ketu do in a chart', expect: 'grahas' },
  { q: 'how should an astrologer put a whole reading together', expect: 'method' },
  { q: 'antardasha inside mahadasha interpretation', expect: 'dasha' },
];

let hitsTop1 = 0;
let hitsTop3 = 0;
const failures: string[] = [];

for (const c of CASES) {
  const { passages, available } = await retrieve(c.q, { limit: 3 });
  if (!available) {
    console.error('index unavailable — run pnpm rag:build first');
    process.exit(1);
  }
  const topics = passages.map((p) => p.chunk.topic);
  const top1 = topics[0] === c.expect;
  const top3 = topics.includes(c.expect);
  if (top1) hitsTop1++;
  if (top3) hitsTop3++;
  else failures.push(`${c.q}  → got [${topics.join(', ')}], wanted ${c.expect}`);

  const legs = [...new Set(passages.flatMap((p) => p.matchedBy))].join('+') || 'none';
  console.log(
    `${top1 ? 'top1' : top3 ? 'top3' : 'MISS'}  ${c.expect.padEnd(10)} ${legs.padEnd(14)} ${c.q}`,
  );
  if (passages[0]) console.log(`        └─ ${passages[0].chunk.title} › ${passages[0].chunk.heading}`);
}

console.log(`\ntop-1 ${hitsTop1}/${CASES.length}   top-3 ${hitsTop3}/${CASES.length}`);
if (failures.length) {
  console.log('\nmisses:');
  for (const f of failures) console.log('  ' + f);
}
process.exit(hitsTop3 === CASES.length ? 0 : 1);
