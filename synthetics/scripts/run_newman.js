
const fs = require('fs');
const { execSync } = require('child_process');

const log = (msg) => fs.appendFileSync('/var/log/synthetics/newman.log', `[${new Date().toISOString()}] ${msg}\n`);

function runFor(site) {
  const base = site.apiBase || site.baseUrl;
  try {
    log(`Running Newman for ${site.site} ${base}`);
    execSync(`newman run api/collection.json --env-var baseUrl=${base}`, { stdio: 'inherit' });
    log(`OK ${site.site}`);
  } catch (e) {
    log(`FAIL ${site.site}: ${e?.status || e?.message}`);
    process.exitCode = 1;
  }
}

const sites = JSON.parse(fs.readFileSync(process.env.SITES_FILE || './sites.json', 'utf8'));
sites.forEach(runFor);
