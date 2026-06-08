// scrapers/linkedin.js
import { randomDelay, normalizeOffer, isDuplicate, autoTag, extractSkills } from './utils.js';

const SEARCH = 'https://www.linkedin.com/jobs/search/?keywords=testeur%20QA%20freelance&location=France';

export async function scrapeLinkedIn(existing = []) {
  const jobs = [];
  let browser = null;
  try {
    const mod = await import('playwright-core');
    browser = await mod.chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
    await page.goto(SEARCH, { waitUntil: 'networkidle', timeout: 25000 });
    await randomDelay(3000, 5000);
    // scroll to load more
    await page.evaluate(() => window.scrollBy(0, 900)).catch(() => {});
    await randomDelay(1000, 2000);
    const items = await page.$$('.jobs-search__results-list li, .base-card, [data-entity-urn]');
    for (const item of items.slice(0, 25)) {
      try {
        const title = (await item.$eval('h3, .base-search-card__title', el => el.textContent.trim()).catch(() => '')) || '';
        const company = (await item.$eval('h4, .base-search-card__subtitle', el => el.textContent.trim()).catch(() => '')).trim();
        const link = (await item.$eval('a', el => el.href).catch(() => '')).trim();
        const meta = (await item.evaluate(el => el.innerText).catch(() => '')) || '';
        if (!title || !link) continue;
        const raw = { title, company, url: link, description: meta, source: 'linkedin', published_at: new Date().toISOString() };
        const norm = normalizeOffer(raw);
        norm.tags.push(...extractSkills(meta));
        autoTag(norm);
        if (!isDuplicate(norm, existing)) jobs.push(norm);
      } catch { /* skip */ }
    }
  } catch (err) {
    console.error('linkedin error:', err.message);
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
  await randomDelay(4500, 6500);
  return jobs;
}
