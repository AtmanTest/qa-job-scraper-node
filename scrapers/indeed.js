// scrapers/indeed.js
import axios from 'axios';
import * as cheerio from 'cheerio';
import { randomDelay, fetchWithRetry, normalizeOffer, isDuplicate, autoTag, extractSkills } from './utils.js';

const SEARCH = 'https://fr.indeed.com/jobs?q=testeur+freelance&l=France&sc=0kf%3Aattr%28DSQF7%29%3B';

export async function scrapeIndeed(existing = []) {
  const jobs = [];
  try {
    const html = await fetchWithRetry(SEARCH, { timeout: 15000 });
    const $ = cheerio.load(html);
    $('[data-jk], .job_seen_beacon, .result').each((_, el) => {
      try {
        const card = $(el);
        const title = (card.find('h2.jobTitle, .jobTitle').first().text() || '').trim();
        const company = (card.find('.companyName, .company').first().text() || '').trim();
        const location = (card.find('.companyLocation').first().text() || '').trim();
        const desc = (card.find('.job-snippet, .summary').first().text() || '').trim();
        const jk = card.attr('data-jk') || '';
        const url = jk ? `https://fr.indeed.com/viewjob?jk=${jk}` : '';
        const date = (card.find('.date').first().text() || '').trim();
        if (!title || !url) return;
        const raw = { title, company, location, url, description: desc, source: 'indeed', published_at: date || new Date().toISOString() };
        const norm = normalizeOffer(raw);
        norm.tags.push(...extractSkills(desc));
        autoTag(norm);
        if (!isDuplicate(norm, existing)) jobs.push(norm);
      } catch { /* skip */ }
    });
  } catch (err) {
    console.error('indeed error:', err.message);
  }
  await randomDelay(3500, 6000);
  return jobs;
}
