import http from 'http';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webDir = path.resolve(__dirname, '..');

function fetchUrl(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers
    };
    http.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, length: data.length, body: data }));
    }).on('error', reject);
  });
}

function postJson(url, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const urlObj = new URL(url);
    const req = http.request({
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let resBody = '';
      res.on('data', chunk => resBody += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: resBody }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  const port = process.env.PORT || 3008;
  console.log(`Starting Next.js production server for smoke tests on port ${port}...`);
  const server = spawn('node', ['node_modules/next/dist/bin/next', 'start', '-p', String(port), '-H', '127.0.0.1'], {
    cwd: webDir,
    stdio: 'inherit'
  });

  // Give server time to spin up
  await new Promise(r => setTimeout(r, 4000));

  try {
    // 1. Check Public Landing Page
    const homeRes = await fetchUrl(`http://127.0.0.1:${port}/`);
    console.log(`Route /                HTTP ${homeRes.statusCode} (${homeRes.length} bytes)`);
    if (homeRes.statusCode !== 200) {
      throw new Error(`Failed route /: expected HTTP 200, got ${homeRes.statusCode}`);
    }
    const headlineExpected = 'A bus can be tracked';
    if (!homeRes.body.includes(headlineExpected)) {
      throw new Error(`Route / did not contain expected public landing headline: "${headlineExpected}"`);
    }
    console.log('✓ Public landing page verified with headline');

    // 2. Check Public Login Page
    const loginRes = await fetchUrl(`http://127.0.0.1:${port}/login`);
    console.log(`Route /login           HTTP ${loginRes.statusCode} (${loginRes.length} bytes)`);
    if (loginRes.statusCode !== 200) {
      throw new Error(`Failed route /login: expected HTTP 200, got ${loginRes.statusCode}`);
    }
    console.log('✓ Public login page verified HTTP 200');

    // 3. Check Route Protection: unauthenticated operational routes must redirect (HTTP 307)
    const operationalRoutes = [
      '/dashboard',
      '/data',
      '/interventions',
      '/simulation',
      '/reports'
    ];

    for (const route of operationalRoutes) {
      const unauthRes = await fetchUrl(`http://127.0.0.1:${port}${route}`);
      console.log(`Unauth ${route.padEnd(16)} HTTP ${unauthRes.statusCode} (Redirect to ${unauthRes.headers.location})`);
      if (unauthRes.statusCode !== 307) {
        throw new Error(`Expected HTTP 307 redirect for unauthenticated ${route}, got ${unauthRes.statusCode}`);
      }
    }
    console.log('✓ Route protection verified: all operational routes redirect unauthenticated requests');

    // 4. Authenticate via /api/auth/login
    console.log('Authenticating operator via /api/auth/login...');
    const loginApiRes = await postJson(`http://127.0.0.1:${port}/api/auth/login`, {
      email: 'operator@hogana.transit',
      password: 'HoganaOps@2025!'
    });

    if (loginApiRes.statusCode !== 200) {
      throw new Error(`Authentication API failed with HTTP ${loginApiRes.statusCode}: ${loginApiRes.body}`);
    }

    const setCookieHeader = loginApiRes.headers['set-cookie'];
    if (!setCookieHeader || setCookieHeader.length === 0) {
      throw new Error('No set-cookie header returned by /api/auth/login');
    }
    const sessionCookie = setCookieHeader[0].split(';')[0];
    console.log(`✓ Authenticated successfully. Session cookie received: ${sessionCookie.slice(0, 25)}...`);

    // 5. Test Authenticated Operational Routes (must all return HTTP 200)
    for (const route of operationalRoutes) {
      const authRes = await fetchUrl(`http://127.0.0.1:${port}${route}`, {
        'Cookie': sessionCookie
      });
      console.log(`Auth   ${route.padEnd(16)} HTTP ${authRes.statusCode} (${authRes.length} bytes)`);
      if (authRes.statusCode !== 200) {
        throw new Error(`Failed authenticated route ${route}: expected HTTP 200, got ${authRes.statusCode}`);
      }
    }

    console.log('✓ ALL ROUTES SMOKE TEST PASSED: Landing page, login, route protection, and all 5 operational routes verified');
  } finally {
    server.kill();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
