// scrapers/inFreelancing.js
import axios from 'axios';
import * as cheerio from 'cheerio';
import { randomDelay, fetchWithRetry, normalizeOffer, isDuplicate, autoTag, extractSkills } from './utils.js';

const BASE = 'https://infreelancing.com';
const SEARCH = `${BASE}/missions-freelance?skill=QA`;

export async function scrapeInFreelancing(existing = []) {
  const jobs = [];
  try {
    const html = await fetchWithRetry(SEARCH, { timeout: 12000 });
    const $ = cheerio.load(html);
    $('.mission-card, .job-card, .listing-item').each((_, el) => {
      try {
        const card = $(el);
        const title = (card.find('h2, h3, .title').first().text() || '').trim();
        const href = (card.find('a').first().attr('href') || '').trim();
        const url = href ? (href.startsWith('http') ? href : `${BASE}${href}`) : '';
        const desc = (card.find('p, .description').first().text() || '').trim();
        const date = (card.find('.date, time').first().text() || '').trim();
        if (!title || !url) return;
        const raw = { title, url, description: desc, source: 'infreelancing', published_at: date || new Date().toISOString() };
        const norm = normalizeOffer(raw);
        norm.tags.push(...extractSkills(desc));
        autoTag(norm);
        if (!isDuplicate(norm, existing)) jobs.push(norm);
      } catch { /* skip */ }
    });
  } catch (err) {
    console.error('inFreelancing error:', err.message);
  }
  await randomDelay(2500, 5000);
  return jobs;
}
