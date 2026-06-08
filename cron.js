import cron from 'cron';
import { SCRAPERS } from './scrapers/index.js';
import { loadJobs } from './storage.js';

function pick(name) {
  const s = SCRAPERS.find(x => x.name === name);
  if (!s) throw new Error(`Unknown scraper: ${name}`);
  return s;
}

export function startCron() {
  for (const name of ['free-work', 'freelance-info', 'codeur', 'infreelancing', 'jooble', 'hellowork']) {
    new cron.CronJob({ cronTime: '0 */6 * * *', onTick: async () => {
      console.log(`[cron] ${name} start`);
      try { await pick(name).run(loadJobs()); } catch (e) { console.error(e.message); }
    }, start: true, timeZone: 'Europe/Paris' });
  }
  for (const name of ['indeed']) {
    new cron.CronJob({ cronTime: '0 8,20 * * *', onTick: async () => {
      console.log(`[cron] ${name} start`);
      try { await pick(name).run(loadJobs()); } catch (e) { console.error(e.message); }
    }, start: true, timeZone: 'Europe/Paris' });
  }
  console.log('[cron] scheduler started (http-only mode)');
}
