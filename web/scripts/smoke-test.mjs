import http from 'http';
import { spawn } from 'child_process';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, length: data.length }));
    }).on('error', reject);
  });
}

async function run() {
  console.log('Starting Next.js production server on port 3008...');
  const server = spawn('node', ['node_modules/next/dist/bin/next', 'start', '-p', '3008', '-H', '127.0.0.1'], {
    cwd: process.cwd(),
    stdio: 'inherit'
  });

  await new Promise(r => setTimeout(r, 3000));

  try {
    const routes = ['/', '/dashboard', '/data', '/interventions', '/simulation', '/reports', '/forecast', '/admin/settings'];
    for (const route of routes) {
      const res = await fetchUrl(`http://127.0.0.1:3008${route}`);
      console.log(`Route ${route.padEnd(20)} HTTP ${res.statusCode} (${res.length} bytes)`);
      const expected = route === '/' ? 307 : 200;
      if (res.statusCode !== expected) {
        throw new Error(`Failed route ${route}: expected ${expected}, got ${res.statusCode}`);
      }
    }
    console.log('ALL ROUTES SMOKE TEST PASSED (HTTP 200)');
  } finally {
    server.kill();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
