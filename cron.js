// cron.js
import cron from 'cron';
import { SCRAPERS } from './scrapers/index.js';
import { loadJobs, saveJobs } from './storage.js';

function pick(name) {
  const s = SCRAPERS.find(x => x.name === name);
  if (!s) throw new Error(`Unknown scraper: ${name}`);
  return s;
}

export function startCron() {
  // Light : free-work freelance-info codeur infreelancing jooble hellowork
  for (const name of ['free-work', 'freelance-info', 'codeur', 'infreelancing', 'jooble', 'hellowork']) {
    new cron.CronJob({ cronTime: '0 */6 * * *', onTick: async () => {
      console.log(`[cron] ${name} start`);
      try { await pick(name).run(loadJobs()); } catch (e) { console.error(e.message); }
    }, start: true, timeZone: 'Europe/Paris' });
  }

  // Medium : indeed malt comet
  for (const name of ['indeed', 'malt', 'comet']) {
    new cron.CronJob({ cronTime: '0 8,20 * * *', onTick: async () => {
      console.log(`[cron] ${name} start`);
      try { await pick(name).run(loadJobs()); } catch (e) { console.error(e.message); }
    }, start: true, timeZone: 'Europe/Paris' });
  }

  // Heavy : linkedin
  new cron.CronJob({ cronTime: '0 9 * * *', onTick: async () => {
    console.log('[cron] linkedin start');
    try { await pick('linkedin').run(loadJobs()); } catch (e) { console.error(e.message); }
  }, start: true, timeZone: 'Europe/Paris' });

  console.log('[cron] scheduler started');
}
