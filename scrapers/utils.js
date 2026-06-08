// scrapers/utils.js
import axios from 'axios';
import * as cheerio from 'cheerio';

export const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export async function randomDelay(min = 2500, max = 5000) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  await new Promise(r => setTimeout(r, ms));
}

export async function fetchWithRetry(url, opts = {}) {
  const max = opts.maxRetries ?? 3;
  const timeout = opts.timeout ?? 10000;
  for (let i = 0; i < max; i++) {
    try {
      const res = await axios.get(url, {
        timeout,
        headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
        params: opts.params,
        ...opts.axios,
      });
      if (res.status < 500) return res.data;
    } catch (err) {
      if (i === max - 1) throw err;
      await randomDelay(1500, 2500);
    }
  }
}

export function extractText(html) {
  if (typeof html !== 'string') return '';
  const $ = cheerio.load(html);
  $('script, style, nav, footer, header').remove();
  return $.root().text().replace(/\s+/g, ' ').trim();
}

export function normalizeOffer(raw) {
  return {
    title: (raw.title || '').trim(),
    source: raw.source,
    url: (raw.url || '').trim(),
    description: (raw.description || '').trim().slice(0, 5000),
    salary: raw.salary || null,
    location: raw.location || null,
    remote: !!raw.remote,
    published_at: raw.published_at || new Date().toISOString(),
    scraped_at: new Date().toISOString(),
    tags: raw.tags || [],
  };
}

export function isDuplicate(job, existing) {
  if (!Array.isArray(existing) || !existing.length) return false;
  return existing.some(j =>
    (j.url && job.url && j.url === job.url) ||
    (j.title === job.title && j.source === job.source)
  );
}

export function autoTag(job) {
  const text = `${job.title} ${job.description}`.toLowerCase();
  const map = {
    QA: ['qa', 'quality assurance'],
    testeur: ['testeur', 'tester'],
    ISTQB: ['istqb'],
    Selenium: ['selenium'],
    Squash: ['squash', 'testlink'],
    recette: ['recette', 'validation fonctionnelle'],
    automatisation: ['automatisation', 'automation', 'robot framework', 'cypress'],
    freelance: ['freelance', 'mission', 'indépendant', 'tjm', 'taux journalier', 'prestation'],
  };
  const tags = new Set(job.tags || []);
  for (const [tag, kws] of Object.entries(map)) {
    if (kws.some(kw => text.includes(kw))) tags.add(tag);
  }
  job.tags = [...tags];
}

export function extractSkills(text) {
  if (!text) return [];
  const known = ['Squash','Selenium','ISTQB','Cypress','JMeter','Postman','Jira','TestRail','Robot Framework','Java','Python','JavaScript','Cucumber'];
  return known.filter(s => new RegExp('\\b' + s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i').test(text));
}

export async function tryPlaywright() {
  try {
    const mod = await import('playwright-core');
    const browser = await mod.chromium.launch({ headless: true });
    await browser.close();
    return true;
  } catch {
    return false;
  }
}
