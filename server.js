import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_PATH = process.env.DATA_PATH || './data/jobs.json';
app.use(express.json());
app.use(express.static('public'));

function loadJobs() {
  try { return JSON.parse(require('fs').readFileSync(DATA_PATH, 'utf-8')); } catch { return []; }
}

app.get('/api/jobs', (req, res) => {
  let jobs = loadJobs();
  const q = (req.query.q || '').toLowerCase();
  const source = (req.query.source || '').toLowerCase();
  if (q) jobs = jobs.filter(j => `${j.title} ${j.description} ${j.location}`.toLowerCase().includes(q));
  if (source) jobs = jobs.filter(j => j.source === source);
  res.json({ count: jobs.length, jobs });
});

app.get('/api/stats', (req, res) => {
  const jobs = loadJobs();
  const sources = {};
  for (const j of jobs) sources[j.source] = (sources[j.source] || 0) + 1;
  res.json({ total: jobs.length, sources, updated_at: jobs[0]?.scraped_at || null });
});

app.post('/api/refresh', express.text({ type: '*/*', limit: '2kb' }), (req, res) => {
  const token = process.env.CRON_TOKEN || '';
  const got = req.headers['x-cron-token'] || '';
  if (token && got !== token) return res.status(401).json({ error: 'unauthorized' });
  // best-effort refresh: rely on periodic cron; for manual refresh return status
  res.json({ ok: true, note: 'Manual refresh is not implemented in serverless context; rely on cron.' });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`QA scraper listening on ${PORT}`));
