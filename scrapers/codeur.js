// scrapers/codeur.js
import axios from 'axios';
import * as cheerio from 'cheerio';
import { randomDelay, fetchWithRetry, normalizeOffer, isDuplicate, autoTag, extractSkills } from './utils.js';

const BASE = 'https://www.codeur.com';
const SEARCH = `${BASE}/testeur`;

export async function scrapeCodeur(existing = []) {
  const jobs = [];
  try {
    const html = await fetchWithRetry(SEARCH, { timeout: 12000 });
    const $ = cheerio.load(html);
    $('[data-project], .project-card, .listing-item').each((_, el) => {
      try {
        const card = $(el);
        const title = (card.find('a, h2, h3').first().text() || '').trim();
        const href = (card.find('a').first().attr('href') || '').trim();
        const url = href ? (href.startsWith('http') ? href : `${BASE}${href}`) : '';
        const desc = (card.find('.description, p, .content').first().text() || '').trim();
        const budget = (card.find('.budget, .price, [data-price]').first().text() || '').trim() || null;
        const date = (card.find('.date, time, [datetime]').first().attr('datetime') || card.find('.date, time').first().text() || '').trim();
        if (!title || !url) return;
        const raw = { title, url, description: desc, salary: budget, source: 'codeur', published_at: date || new Date().toISOString() };
        const norm = normalizeOffer(raw);
        norm.tags.push(...extractSkills(desc));
        autoTag(norm);
        if (!isDuplicate(norm, existing)) jobs.push(norm);
      } catch { /* skip */ }
    });
  } catch (err) {
    console.error('codeur error:', err.message);
  }
  await randomDelay(2500, 5000);
  return jobs;
}
