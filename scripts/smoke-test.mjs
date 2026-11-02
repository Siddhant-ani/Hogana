import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webScript = path.resolve(__dirname, '..', 'web', 'scripts', 'smoke-test.mjs');

const child = spawn(process.execPath, [webScript], {
  stdio: 'inherit'
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
