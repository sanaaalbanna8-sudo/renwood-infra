import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseGuide } from '../src/lib/guide/parseGuide.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = join(root, 'content', 'guide.md');
const outputPath = join(root, 'src', 'data', 'guide.generated.json');
const notesPath = join(root, 'docs', 'guide-import-notes.md');

try {
  const source = readFileSync(sourcePath, 'utf8');
  const doc = parseGuide(source);
  writeFileSync(outputPath, `${JSON.stringify(doc, null, 2)}\n`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.startsWith('TABLE_UNEVEN')) {
    const note = `\n\n## جدول لم ينقسم\n\n${message.slice('TABLE_UNEVEN'.length).trim()}\n`;
    writeFileSync(notesPath, `${readFileSync(notesPath, 'utf8')}${note}`);
    console.error(message);
    process.exit(1);
  }
  throw error;
}
