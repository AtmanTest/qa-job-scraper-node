// scrapers/warmup.js
// Optional warmup: verify Playwright headless Chromium once at boot
// and keep the job short to avoid Render build timeout.
export async function warmup() {
  console.log('[warmup] start');
  try {
    const ok = await (await import('./utils.js')).tryPlaywright();
    console.log('[warmup] playwright ok =', ok);
  } catch (err) {
    console.error('[warmup] failed:', err.message);
  }
  console.log('[warmup] done');
  return true;
}
if (process.argv[1] === new URL(import.meta.url).pathname) warmup();
