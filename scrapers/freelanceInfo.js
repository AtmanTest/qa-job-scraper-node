// scrapers/freelanceInfo.js
import axios from 'axios';
import * as cheerio from 'cheerio';
import { randomDelay, fetchWithRetry, normalizeOffer, isDuplicate, autoTag, extractSkills } from './utils.js';

const BASE = 'https://www.freelance-informatique.fr';
const SEARCH = `${BASE}/mission-testeur-fonctionnel-n94`;

export async function scrapeFreelanceInfo(existing = []) {
  const jobs = [];
  try {
    const html = await fetchWithRetry(SEARCH, { timeout: 12000 });
    const $ = cheerio.load(html);
    $('.job-item, .mission-card, .result-item, tr.job').each((_, el) => {
      try {
        const card = $(el);
        const title = (card.find('a, h2, h3').first().text() || '').trim();
        const href = (card.find('a').first().attr('href') || '').trim();
        const url = href ? (href.startsWith('http') ? href : `${BASE}${href}`) : '';
        const desc = (card.find('.description, p, td').first().text() || '').trim();
        const date = (card.find('.date, time, .published').first().text() || '').trim();
        const skills = [];
        card.find('.skill, .tag, .competence').each((_, s) => skills.push($(s).text().trim()));
        if (!title || !url) return;
        const raw = { title, url, description: `${desc} Compétences: ${skills.join(', ')}`, source: 'freelance-info', published_at: date || new Date().toISOString(), tags: skills };
        const norm = normalizeOffer(raw);
        norm.tags.push(...extractSkills(desc));
        autoTag(norm);
        if (!isDuplicate(norm, existing)) jobs.push(norm);
      } catch { /* skip */ }
    });
  } catch (err) {
    console.error('freelanceInfo error:', err.message);
  }
  await randomDelay(2500, 5000);
  return jobs;
}
