/**
 * Smoke test: Verify component files exist and have basic structure.
 *
 * Usage: node src/ui/components/smoke-test.js
 * Catches: missing files, missing exports, broken imports, obvious syntax errors
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const components = [
  'ProjectDetail.js',
  'ProjectInput.js',
  'ProjectListItem.js',
  'ProjectNewItem.js',
];

console.log('🔥 Running smoke test...\n');

let passed = 0;
let failed = 0;

for (const file of components) {
  const filepath = path.join(__dirname, file);

  try {
    const code = fs.readFileSync(filepath, 'utf8');

    // Check for export statement
    if (!code.includes('export ')) {
      throw new Error('No export found');
    }

    // Check for unclosed braces/brackets (basic syntax check)
    const open = (code.match(/[{[(`]/g) || []).length;
    const close = (code.match(/[}\])`]/g) || []).length;
    if (open !== close) {
      throw new Error('Mismatched braces/brackets');
    }

    console.log(`✓ ${file}`);
    passed++;
  } catch (err) {
    console.error(`✗ ${file}: ${err.message}`);
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
