// scrapers/freeWork.js
import axios from 'axios';
import * as cheerio from 'cheerio';
import { randomDelay, fetchWithRetry, normalizeOffer, isDuplicate, autoTag, extractSkills } from './utils.js';

const BASE = 'https://www.free-work.com';
const SEARCH = `${BASE}/fr/tech-it/jobs/ingenieur-test-et-validation-testeur-qa`;

export async function scrapeFreeWork(existing = []) {
  const jobs = [];
  try {
    const html = await fetchWithRetry(SEARCH, { timeout: 12000 });
    const $ = cheerio.load(html);
    $('[data-testid="job-card"], .job-card, .job-list-item').each((_, el) => {
      try {
        const card = $(el);
        const title = (card.find('h2, .job-title, a[href*="/jobs/"]').first().text() || '').trim();
        const href = (card.find('a[href*="/job/"]').first().attr('href') || '').trim();
        const url = href ? (href.startsWith('http') ? href : `${BASE}${href}`) : '';
        const company = (card.find('.company-name, .job-company').first().text() || '').trim();
        const location = (card.find('.job-location, .location').first().text() || '').trim();
        const desc = (card.find('.job-description, .description, p').first().text() || '').trim();
        const salary = (card.find('.salary, .job-salary').first().text() || '').trim() || (/tjm|taux journalier/i.test(desc) ? 'TJM: voir détail' : null);
        const remote = /télétravail|full remote|hybrid/i.test(card.text()) || false;
        if (!title || !url) return;
        const raw = { title, company, location, url, description: desc, salary, remote, source: 'free-work' };
        const norm = normalizeOffer(raw);
        norm.tags.push(...extractSkills(desc));
        autoTag(norm);
        if (!isDuplicate(norm, existing)) jobs.push(norm);
      } catch { /* skip */ }
    });
  } catch (err) {
    console.error('freeWork error:', err.message);
  }
  await randomDelay(2500, 5000);
  return jobs;
}
