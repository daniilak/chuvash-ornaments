// Regenerates only from the checked-in, reviewed snapshot. Does not fetch anything.
import { readFileSync, writeFileSync } from 'node:fs';
const data=JSON.parse(readFileSync('data/patterns.json','utf8'));
const motifs=data.patterns.filter(m=>!m.compact);
if(data.license!=='CC0-1.0'||motifs.length!==16) throw new Error('Review the upstream catalog/schema before updating.');
const head=`import type { MotifData } from "./types.js";

function freeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
}

/** Lossless coordinates from data/patterns.json (CC0-1.0). */
export const MOTIFS: readonly MotifData[] = freeze(`;
const tail=`);

export function getMotif(id: string): MotifData {
  const motif = MOTIFS.find(m => m.id === id);
  if (!motif) throw new RangeError(\`Unknown motif: \${id}\`);
  return motif;
}
`;
writeFileSync('src/catalog.ts',head+JSON.stringify(motifs)+tail);
console.log('Regenerated 16 lossless motifs from local CC0 snapshot.');
