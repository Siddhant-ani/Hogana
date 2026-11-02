import path from 'path';
import { fileURLToPath } from 'url';
import { createJiti } from 'jiti';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jiti = createJiti(__filename, {
  alias: {
    'server-only': path.resolve(__dirname, '../node_modules/server-only/empty.js')
  }
});

await jiti.import('./test-engine.ts');
