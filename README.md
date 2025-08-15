
# Website Ops Stack (Observability + Synthetics)

Turn-key repo to stand up **Grafana + Prometheus + Loki + Tempo + Blackbox Exporter** and a **synthetics runner** (Playwright/Newman/Linkinator/Lighthouse) on a single VM via Docker Compose.

## Prereqs
- Docker & docker-compose plugin installed on the VM
- Ports you want open (typically 3000 for Grafana)

## Quick start
```bash
git clone <this repo> && cd website-ops-stack
docker compose pull
docker compose build synthetics
docker compose up -d
```

Then open Grafana at http://<VM-IP>:3000 (user: admin / pass: admin). Add dashboards and alerts as needed.

## Configure your sites
Edit `synthetics/sites.json`:
```json
[
  {
    "site": "siteA",
    "env": "prod",
    "baseUrl": "https://example.com",
    "apiBase": "https://api.example.com",
    "sitemap": "https://example.com/sitemap.xml",
    "lighthouseUrls": ["https://example.com/"],
    "playwright": { "loginPath": "/", "assertText": "Example Domain" }
  }
]
```

The synthetics container runs on a schedule (see `synthetics/scripts/cronfile`):
- API checks (Newman) every minute
- Playwright E2E every 5 minutes
- Link checks nightly at 03:00
- Lighthouse audits at 03:30

Logs from runs are written to `/var/log/synthetics/*.log` and harvested by Promtail → Loki → Grafana.

## Prometheus blackbox targets
Prometheus already probes example.com. Add your own targets in `configs/prometheus/prometheus.yml` or mount a file in `./targets` and reference it in the Prometheus config if you prefer file_sd.

## Alerting
Alertmanager is wired to a placeholder webhook. Replace it with Slack/Email/PagerDuty as desired in `configs/alertmanager/alertmanager.yml`.

## Notes
- Security: keep Grafana behind VPN/SSO or at least a firewall. Change the default admin password.
- Performance: adjust retention and volumes per your needs.
- Extensibility: add OWASP ZAP and k6 as separate containers if you want scheduled security/load tests.
```

