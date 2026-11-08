import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { diffAtoms, guideStats, parseGuide, type GuideDoc } from '../src/lib/guide/parseGuide.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(join(root, 'content', 'guide.md'), 'utf8');
const saved = JSON.parse(readFileSync(join(root, 'src', 'data', 'guide.generated.json'), 'utf8')) as GuideDoc;
const fresh = parseGuide(source);
const drift = diffAtoms(source, fresh);
const stats = guideStats(fresh);

console.log(`الأنشطة: ${stats.activities}`);
console.log(`المراحل: ${stats.stages}`);
console.log(`الخطوات: ${stats.steps}`);
console.log(`الجداول: ${stats.tables}`);
console.log(`الصفوف: ${stats.rows}`);
console.log(`الأمثلة: ${stats.examples}`);
console.log(`عناصر الاختيار: ${stats.checks}`);

const savedJson = JSON.stringify(saved);
const freshJson = JSON.stringify(fresh);
if (savedJson !== freshJson) {
  console.error('الملف المولَّد لا يطابق نتيجة المحوّل. شغّل npm run build-guide.');
  process.exit(1);
}
if (drift.missing.length || drift.extra.length) {
  console.error(`نقص: ${drift.missing.length}`);
  for (const item of drift.missing.slice(0, 8)) console.error(`- ${item}`);
  console.error(`زيادة: ${drift.extra.length}`);
  for (const item of drift.extra.slice(0, 8)) console.error(`+ ${item}`);
  process.exit(1);
}
