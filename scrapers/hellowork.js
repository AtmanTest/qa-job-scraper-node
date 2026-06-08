// scrapers/hellowork.js
import axios from 'axios';
import * as cheerio from 'cheerio';
import { randomDelay, fetchWithRetry, normalizeOffer, isDuplicate, autoTag, extractSkills } from './utils.js';

const BASE = 'https://www.hellowork.com';
const SEARCH = `${BASE}/fr-fr/emploi/metier_testeur-qa.html`;

export async function scrapeHelloWork(existing = []) {
  const jobs = [];
  try {
    const html = await fetchWithRetry(SEARCH, { timeout: 12000 });
    const $ = cheerio.load(html);
    $('[data-job-id], .job-card, .job-list-item, .offer').each((_, el) => {
      try {
        const card = $(el);
        const title = (card.find('h2, h3, .job-title').first().text() || '').trim();
        const href = (card.find('a').first().attr('href') || '').trim();
        const url = href ? (href.startsWith('http') ? href : `${BASE}${href}`) : '';
        const company = (card.find('.company, .job-company').first().text() || '').trim();
        const location = (card.find('.location, .job-location').first().text() || '').trim();
        const desc = (card.find('p, .description').first().text() || '').trim();
        if (!title || !url) return;
        const raw = { title, company, location, url, description: desc, source: 'hellowork' };
        const norm = normalizeOffer(raw);
        norm.tags.push(...extractSkills(desc));
        autoTag(norm);
        if (!isDuplicate(norm, existing)) jobs.push(norm);
      } catch { /* skip */ }
    });
  } catch (err) {
    console.error('hellowork error:', err.message);
  }
  await randomDelay(2500, 5000);
  return jobs;
}
