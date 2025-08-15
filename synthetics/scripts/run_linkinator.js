
const fs = require('fs');
const { execSync } = require('child_process');

const log = (msg) => fs.appendFileSync('/var/log/synthetics/links.log', `[${new Date().toISOString()}] ${msg}\n`);

function runFor(site) {
  const start = site.sitemap || site.baseUrl;
  try {
    log(`Running linkinator for ${site.site} ${start}`);
    execSync(`npx linkinator ${start} --skip '.*(\.pdf)$' --recurse --silent`, { stdio: 'inherit' });
    log(`OK ${site.site}`);
  } catch (e) {
    log(`FAIL ${site.site}: ${e?.status || e?.message}`);
    process.exitCode = 1;
  }
}

const sites = JSON.parse(fs.readFileSync(process.env.SITES_FILE || './sites.json', 'utf8'));
sites.forEach(runFor);
