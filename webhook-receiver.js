#!/usr/bin/env node

const http = require('http');
const { execSync } = require('child_process');
const crypto = require('crypto');

const PORT = process.env.WEBHOOK_PORT || 3001;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = 'benlten/squeezeimage-ops';

// Simple webhook receiver for triggering tests
const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook/app-deployed') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        
        console.log(`[${new Date().toISOString()}] Received deployment webhook:`, payload);
        
        // Log the deployment
        const logEntry = `[${new Date().toISOString()}] App deployment detected: ${payload.version || 'unknown'}\n`;
        execSync(`echo '${logEntry}' >> ~/deployment-log.txt`);
        
        // Trigger GitHub Actions test workflow
        if (GITHUB_TOKEN) {
          triggerGitHubWorkflow(payload);
        } else {
          console.log('No GitHub token configured, skipping workflow trigger');
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'success', message: 'Webhook received' }));
        
      } catch (error) {
        console.error('Webhook processing error:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', message: error.message }));
      }
    });
    
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'error', message: 'Not found' }));
  }
});

function triggerGitHubWorkflow(payload) {
  try {
    const curl = `curl -X POST \\
      -H "Accept: application/vnd.github.v3+json" \\
      -H "Authorization: token ${GITHUB_TOKEN}" \\
      https://api.github.com/repos/${GITHUB_REPO}/dispatches \\
      -d '{"event_type":"app-deployed","client_payload":${JSON.stringify(payload)}}'`;
    
    execSync(curl);
    console.log('✅ Triggered GitHub Actions test workflow');
    
  } catch (error) {
    console.error('Failed to trigger GitHub workflow:', error.message);
  }
}

server.listen(PORT, () => {
  console.log(`🎣 Webhook receiver listening on port ${PORT}`);
  console.log(`💡 Send POST requests to: http://localhost:${PORT}/webhook/app-deployed`);
  console.log(`📝 Example payload: {"version": "1.0.0", "environment": "production"}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});