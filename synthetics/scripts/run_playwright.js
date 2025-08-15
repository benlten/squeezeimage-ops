
const fs = require('fs');
const { execSync } = require('child_process');

const log = (msg) => {
  fs.appendFileSync('/var/log/synthetics/playwright.log', `[${new Date().toISOString()}] ${msg}\n`);
};

function runFor(site) {
  try {
    const env = { ...process.env, BASE_URL: site.baseUrl, PW_ASSERT_TEXT: site.playwright?.assertText || '' };
    log(`Running Playwright for ${site.site} ${site.baseUrl}`);
    execSync('npx playwright test e2e/smoke.spec.js --reporter=list', { stdio: 'inherit', env });
    log(`OK ${site.site}`);
  } catch (e) {
    log(`FAIL ${site.site}: ${e?.status || e?.message}`);
    process.exitCode = 1;
  }
}

const sites = JSON.parse(fs.readFileSync(process.env.SITES_FILE || './sites.json', 'utf8'));
sites.forEach(runFor);
