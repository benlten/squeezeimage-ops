
FROM mcr.microsoft.com/playwright:v1.46.0-jammy

# Install Node-based tools
RUN npm -g config set fund false && npm -g config set audit false \
 && npm install -g newman @playwright/test linkinator @lhci/cli

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install || true

COPY . /app

# Create log dir
RUN mkdir -p /var/log/synthetics

# Install cron
RUN apt-get update && apt-get install -y cron && rm -rf /var/lib/apt/lists/*

# Install jq for simple JSON parsing
RUN apt-get update && apt-get install -y jq && rm -rf /var/lib/apt/lists/*

# Copy crontab
COPY scripts/cronfile /etc/cron.d/synthetics-cron
RUN chmod 0644 /etc/cron.d/synthetics-cron && crontab /etc/cron.d/synthetics-cron

# Entrypoint: start cron and tail logs
CMD service cron start && tail -F /var/log/synthetics/*.log
