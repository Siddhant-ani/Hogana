import fs from 'fs';
import path from 'path';

function findNftFiles(dir, list = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findNftFiles(full, list);
    } else if (entry.name.endsWith('.nft.json')) {
      list.push(full);
    }
  }
  return list;
}

const nfts = findNftFiles(path.resolve('web/.next'));
console.log(`Found ${nfts.length} .nft.json files in web/.next`);

const expectedFiles = [
  'routes.csv',
  'stops.csv',
  'scheduled_trips.csv',
  'stop_times.csv',
  'passenger_loads.csv',
  'bus_positions.csv',
  'vehicles.csv',
  'crew_availability.csv',
  'demo_assumptions.json'
];

let foundInAny = new Set();
let manifestsWithData = [];

for (const nftPath of nfts) {
  try {
    const raw = fs.readFileSync(nftPath, 'utf8');
    const parsed = JSON.parse(raw);
    const files = parsed.files || [];
    const demoFiles = files.filter(f => f.includes('data/demo') || f.includes('data\\demo'));
    if (demoFiles.length > 0) {
      manifestsWithData.push({
        manifest: path.relative(process.cwd(), nftPath),
        count: demoFiles.length,
        files: demoFiles
      });
      for (const df of demoFiles) {
        const basename = path.basename(df);
        if (expectedFiles.includes(basename)) {
          foundInAny.add(basename);
        }
      }
    }
  } catch (e) {
    // ignore
  }
}

console.log(`Manifests containing data/demo traces: ${manifestsWithData.length}`);
for (const m of manifestsWithData.slice(0, 5)) {
  console.log(`- ${m.manifest} (${m.count} data files)`);
}

console.log(`\nVerified dataset files traced in production build output (${foundInAny.size}/9):`);
for (const exp of expectedFiles) {
  const present = foundInAny.has(exp);
  console.log(`  [${present ? 'PASS' : 'FAIL'}] ${exp}`);
}

if (foundInAny.size === 9) {
  console.log('\nALL 9 DATASET FILES ARE TRACED IN PRODUCTION OUTPUT MANIFESTS');
} else {
  console.error('\nMISSING DATASET FILES IN PRODUCTION OUTPUT MANIFESTS');
  process.exit(1);
}
