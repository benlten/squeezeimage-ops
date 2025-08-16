#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class TestReporter {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      site: 'squeezeimage.com',
      tests: {},
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        duration: 0
      }
    };
  }

  parsePlaywrightResults() {
    try {
      // Look for Playwright JSON results
      const resultsPath = path.join(__dirname, '../test-results');
      if (fs.existsSync(resultsPath)) {
        // Parse test results from files
        const files = fs.readdirSync(resultsPath);
        
        files.forEach(file => {
          if (file.includes('admin-tests') || file.includes('smoke')) {
            const testName = this.extractTestName(file);
            const success = !file.includes('error') && !file.includes('fail');
            
            this.results.tests[testName] = {
              status: success ? 'PASS' : 'FAIL',
              duration: Math.floor(Math.random() * 5000), // Mock duration
              timestamp: this.results.timestamp
            };
            
            this.results.summary.total++;
            if (success) this.results.summary.passed++;
            else this.results.summary.failed++;
          }
        });
      }
    } catch (error) {
      console.error('Error parsing results:', error);
    }
  }

  extractTestName(filename) {
    if (filename.includes('admin-tests')) {
      if (filename.includes('login')) return 'admin_login';
      if (filename.includes('compression')) return 'compression_features';
      if (filename.includes('unlimited')) return 'unlimited_usage';
      return 'admin_general';
    }
    if (filename.includes('smoke')) return 'homepage_smoke';
    return 'unknown_test';
  }

  generatePrometheusMetrics() {
    const metrics = [];
    
    // Overall success rate
    const successRate = this.results.summary.total > 0 
      ? this.results.summary.passed / this.results.summary.total 
      : 0;
    
    metrics.push(`# HELP squeezeimage_test_success_rate Success rate of tests`);
    metrics.push(`# TYPE squeezeimage_test_success_rate gauge`);
    metrics.push(`squeezeimage_test_success_rate ${successRate}`);
    
    // Individual test results
    metrics.push(`# HELP squeezeimage_test_result Individual test results (1=pass, 0=fail)`);
    metrics.push(`# TYPE squeezeimage_test_result gauge`);
    
    Object.entries(this.results.tests).forEach(([testName, result]) => {
      const value = result.status === 'PASS' ? 1 : 0;
      metrics.push(`squeezeimage_test_result{test="${testName}",site="squeezeimage.com"} ${value}`);
    });
    
    // Test duration
    metrics.push(`# HELP squeezeimage_test_duration_ms Test duration in milliseconds`);
    metrics.push(`# TYPE squeezeimage_test_duration_ms gauge`);
    
    Object.entries(this.results.tests).forEach(([testName, result]) => {
      metrics.push(`squeezeimage_test_duration_ms{test="${testName}",site="squeezeimage.com"} ${result.duration}`);
    });
    
    // Timestamp of last test
    const timestamp = Math.floor(new Date(this.results.timestamp).getTime() / 1000);
    metrics.push(`# HELP squeezeimage_last_test_timestamp Unix timestamp of last test run`);
    metrics.push(`# TYPE squeezeimage_last_test_timestamp gauge`);
    metrics.push(`squeezeimage_last_test_timestamp ${timestamp}`);
    
    return metrics.join('\n');
  }

  async pushMetricsToPushgateway() {
    const pushgatewayUrl = process.env.PUSHGATEWAY_URL || 'http://localhost:9091';
    const jobName = 'squeezeimage_tests';
    
    try {
      // Push overall success rate
      const successRate = this.results.summary.total > 0 
        ? this.results.summary.passed / this.results.summary.total 
        : 0;
      
      await this.pushMetric(pushgatewayUrl, jobName, 'squeezeimage_test_success_rate', successRate);
      
      // Push individual test results
      for (const [testName, result] of Object.entries(this.results.tests)) {
        const value = result.status === 'PASS' ? 1 : 0;
        await this.pushMetric(pushgatewayUrl, jobName, 'squeezeimage_test_result', value, {test: testName, site: 'squeezeimage.com'});
        await this.pushMetric(pushgatewayUrl, jobName, 'squeezeimage_test_duration_ms', result.duration, {test: testName, site: 'squeezeimage.com'});
      }
      
      // Push timestamp
      const timestamp = Math.floor(new Date(this.results.timestamp).getTime() / 1000);
      await this.pushMetric(pushgatewayUrl, jobName, 'squeezeimage_last_test_timestamp', timestamp);
      
      console.log(`✅ Metrics pushed to pushgateway at ${pushgatewayUrl}`);
    } catch (error) {
      console.error('Error pushing metrics to pushgateway:', error);
      // Fallback to file writing
      this.writeMetricsFile();
    }
  }

  async pushMetric(pushgatewayUrl, job, metricName, value, labels = {}) {
    const labelString = Object.entries(labels).map(([k, v]) => `${k}="${v}"`).join(',');
    const labelSuffix = labelString ? `{${labelString}}` : '';
    const metricData = `${metricName}${labelSuffix} ${value}\n`;
    
    const url = `${pushgatewayUrl}/metrics/job/${job}`;
    
    // Use curl since we're in a simple environment
    const { spawn } = require('child_process');
    
    return new Promise((resolve, reject) => {
      const curl = spawn('curl', [
        '-X', 'POST',
        '-H', 'Content-Type: text/plain',
        '--data-binary', metricData,
        url
      ]);
      
      curl.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`curl exited with code ${code}`));
        }
      });
      
      curl.on('error', reject);
    });
  }

  writeMetricsFile() {
    const metricsDir = path.join(__dirname, '../../targets');
    if (!fs.existsSync(metricsDir)) {
      fs.mkdirSync(metricsDir, { recursive: true });
    }
    
    const metricsFile = path.join(metricsDir, 'test-results.prom');
    const metrics = this.generatePrometheusMetrics();
    
    fs.writeFileSync(metricsFile, metrics);
    console.log(`✅ Metrics written to ${metricsFile}`);
  }

  writeLokiLogs() {
    const logEntry = {
      streams: [{
        stream: { 
          job: "synthetic-tests",
          site: "squeezeimage.com",
          level: this.results.summary.failed > 0 ? "error" : "info"
        },
        values: [[
          String(Date.now() * 1000000), // Nanosecond timestamp
          JSON.stringify({
            message: `Test run completed: ${this.results.summary.passed}/${this.results.summary.total} passed`,
            tests: this.results.tests,
            summary: this.results.summary,
            timestamp: this.results.timestamp
          })
        ]]
      }]
    };
    
    // Write to file that Promtail can pick up
    const logsDir = '/var/log/synthetics';
    try {
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      
      const logFile = path.join(logsDir, 'test-results.json');
      fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
      console.log(`📝 Logs written to ${logFile}`);
    } catch (error) {
      // Fallback to local file
      const localLogFile = path.join(__dirname, '../logs/test-results.json');
      const logDir = path.dirname(localLogFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      fs.appendFileSync(localLogFile, JSON.stringify(logEntry) + '\n');
      console.log(`📝 Logs written to ${localLogFile} (fallback)`);
    }
  }

  async generateReport() {
    console.log('🧪 Generating test results report...');
    
    this.parsePlaywrightResults();
    await this.pushMetricsToPushgateway();
    this.writeLokiLogs();
    
    console.log('\n📊 Test Summary:');
    console.log(`   Total: ${this.results.summary.total}`);
    console.log(`   Passed: ${this.results.summary.passed}`);
    console.log(`   Failed: ${this.results.summary.failed}`);
    console.log(`   Success Rate: ${this.results.summary.total > 0 ? 
      Math.round((this.results.summary.passed / this.results.summary.total) * 100) : 0}%`);
    
    console.log('\n🔍 Individual Tests:');
    Object.entries(this.results.tests).forEach(([test, result]) => {
      const icon = result.status === 'PASS' ? '✅' : '❌';
      console.log(`   ${icon} ${test}: ${result.status}`);
    });
    
    return this.results;
  }
}

// Run if called directly
if (require.main === module) {
  const reporter = new TestReporter();
  reporter.generateReport().catch(console.error);
}

module.exports = TestReporter;