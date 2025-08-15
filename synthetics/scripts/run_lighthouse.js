
const fs = require('fs');
const { execSync } = require('child_process');

const log = (msg) => fs.appendFileSync('/var/log/synthetics/lighthouse.log', `[${new Date().toISOString()}] ${msg}\n`);

function runFor(site) {
  const urls = site.lighthouseUrls || [site.baseUrl];
  urls.forEach(u => {
    try {
      log(`Running Lighthouse for ${site.site} ${u}`);
      execSync(`lhci collect --url=${u} --numberOfRuns=1 --settings.preset=desktop`, { stdio: 'inherit' });
      log(`OK ${site.site} ${u}`);
    } catch (e) {
      log(`FAIL ${site.site} ${u}: ${e?.status || e?.message}`);
      process.exitCode = 1;
    }
  });
}

const sites = JSON.parse(fs.readFileSync(process.env.SITES_FILE || './sites.json', 'utf8'));
sites.forEach(runFor);
