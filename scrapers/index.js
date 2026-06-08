import { loadJobs, saveJobs } from '../storage.js';
import { scrapeFreeWork } from './freeWork.js';
import { scrapeFreelanceInfo } from './freelanceInfo.js';
import { scrapeCodeur } from './codeur.js';
import { scrapeIndeed } from './indeed.js';
import { scrapeHelloWork } from './hellowork.js';
import { scrapeJooble } from './jooble.js';
import { scrapeInFreelancing } from './inFreelancing.js';

export const SCRAPERS = [
  { name: 'free-work', run: scrapeFreeWork },
  { name: 'freelance-info', run: scrapeFreelanceInfo },
  { name: 'codeur', run: scrapeCodeur },
  { name: 'indeed', run: scrapeIndeed },
  { name: 'hellowork', run: scrapeHelloWork },
  { name: 'jooble', run: scrapeJooble },
  { name: 'infreelancing', run: scrapeInFreelancing },
];

export async function runAll() {
  const existing = loadJobs();
  const results = [];
  for (const s of SCRAPERS) {
    try {
      const t0 = Date.now();
      const jobs = await s.run(existing);
      const inserted = saveJobs(jobs);
      results.push({ source: s.name, found: jobs.length, inserted, duration_ms: Date.now() - t0, error: null });
      console.log(`[OK] ${s.name}: found=${jobs.length} inserted=${inserted}`);
    } catch (err) {
      results.push({ source: s.name, found: 0, inserted: 0, error: err.message });
      console.error(`[ERROR] ${s.name}:`, err.message);
    }
  }
  return results;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const arg = process.argv[2];
  const targets = arg ? SCRAPERS.filter(s => s.name === arg) : SCRAPERS;
  (async () => {
    const existing = loadJobs();
    const results = [];
    for (const s of targets) {
      try {
        const t0 = Date.now();
        const jobs = await s.run(existing);
        const inserted = saveJobs(jobs);
        results.push({ source: s.name, found: jobs.length, inserted, error: null });
      } catch (err) {
        results.push({ source: s.name, found: 0, inserted: 0, error: err.message });
      }
    }
    console.log(JSON.stringify(results, null, 2));
    process.exit(0);
  })();
}
