import { readFileSync, writeFileSync, existsSync } from 'fs';
const DATA_PATH = process.env.DATA_PATH || './data/jobs.json';
export function loadJobs() {
  if (!existsSync(DATA_PATH)) return [];
  try { return JSON.parse(readFileSync(DATA_PATH, 'utf-8')); } catch { return []; }
}
export function saveJobs(jobs) {
  if (!jobs.length) return 0;
  const existing = loadJobs();
  const seen = new Set(existing.map(j => j.url));
  const fresh = jobs.filter(j => !seen.has(j.url));
  const merged = [...fresh, ...existing];
  writeFileSync(DATA_PATH, JSON.stringify(merged, null, 2));
  return fresh.length;
}
