// scrapers/malt.js
import { randomDelay, normalizeOffer, isDuplicate, autoTag, extractSkills } from './utils.js';

const SEARCH = 'https://www.malt.fr/s?q=testeur+QA';

export async function scrapeMalt(existing = []) {
  const jobs = [];
  let browser = null;
  try {
    const mod = await import('playwright-core');
    browser = await mod.chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
    await page.goto(SEARCH, { waitUntil: 'networkidle', timeout: 20000 });
    await randomDelay(2000, 3500);
    const cards = await page.$$('[data-testid="search-result-card"], .search-result, .job-card, article');
    for (const card of cards.slice(0, 30)) {
      try {
        const title = (await card.$eval('h2, h3, .title', el => el.textContent.trim()).catch(() => '')) || '';
        const url = (await card.$eval('a', el => el.href).catch(() => '')).trim();
        const text = (await card.evaluate(el => el.innerText).catch(() => '')) || '';
        const budget = (text.match(/[0-9][\s0-9]*(?:€|EUR|TJM)/i)?.[0] || null);
        const duration = (text.match(/(\d+[\s]?(?:semaines?|mois?|jours?))/i)?.[0] || null);
        if (!title || !url) continue;
        const raw = { title, url, description: text.slice(0, 5000), salary: budget ?? duration, source: 'malt', published_at: new Date().toISOString() };
        const norm = normalizeOffer(raw);
        norm.tags.push(...extractSkills(text));
        autoTag(norm);
        if (!isDuplicate(norm, existing)) jobs.push(norm);
      } catch { /* skip */ }
    }
  } catch (err) {
    console.error('malt error:', err.message);
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
  await randomDelay(3500, 5500);
  return jobs;
}
