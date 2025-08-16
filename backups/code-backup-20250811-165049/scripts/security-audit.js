#!/usr/bin/env node

/**
 * Security Audit Script
 * Performs comprehensive security scanning including OWASP dependency checks
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);

const SECURITY_REPORT_DIR = path.join(process.cwd(), 'security-reports');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

// Ensure reports directory exists
if (!fs.existsSync(SECURITY_REPORT_DIR)) {
  fs.mkdirSync(SECURITY_REPORT_DIR, { recursive: true });
}

class SecurityAuditor {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      checks: [],
      vulnerabilities: {
        critical: 0,
        high: 0,
        moderate: 0,
        low: 0,
        info: 0
      },
      passed: true
    };
  }

  async runNpmAudit() {
    console.log('🔍 Running npm audit...');
    try {
      const { stdout } = await execAsync('npm audit --json');
      const auditResult = JSON.parse(stdout);
      
      this.results.checks.push({
        name: 'npm-audit',
        status: 'completed',
        vulnerabilities: auditResult.metadata.vulnerabilities
      });

      // Update vulnerability counts
      Object.keys(auditResult.metadata.vulnerabilities).forEach(level => {
        if (this.results.vulnerabilities[level] !== undefined) {
          this.results.vulnerabilities[level] += auditResult.metadata.vulnerabilities[level];
        }
      });

      // Save detailed npm audit report
      fs.writeFileSync(
        path.join(SECURITY_REPORT_DIR, `npm-audit-${TIMESTAMP}.json`),
        JSON.stringify(auditResult, null, 2)
      );

      console.log('✅ npm audit completed');
      return auditResult;
    } catch (error) {
      console.error('❌ npm audit failed:', error.message);
      this.results.checks.push({
        name: 'npm-audit',
        status: 'failed',
        error: error.message
      });
      return null;
    }
  }

  async runBetterNpmAudit() {
    console.log('🔍 Running better-npm-audit...');
    try {
      const { stdout } = await execAsync('npx better-npm-audit audit --level moderate --json');
      const result = JSON.parse(stdout);
      
      this.results.checks.push({
        name: 'better-npm-audit',
        status: 'completed',
        issues: result.length
      });

      console.log('✅ better-npm-audit completed');
      return result;
    } catch (error) {
      // better-npm-audit exits with non-zero if vulnerabilities found
      if (error.stdout) {
        try {
          const result = JSON.parse(error.stdout);
          this.results.checks.push({
            name: 'better-npm-audit',
            status: 'completed-with-issues',
            issues: result.length
          });
          return result;
        } catch (parseError) {
          // Continue if parse fails
        }
      }
      
      console.error('❌ better-npm-audit failed:', error.message);
      this.results.checks.push({
        name: 'better-npm-audit',
        status: 'failed',
        error: error.message
      });
      return null;
    }
  }

  async generateSBOM() {
    console.log('📦 Generating Software Bill of Materials (SBOM)...');
    try {
      await execAsync('npx @cyclonedx/cyclonedx-npm --output-file ' + 
        path.join(SECURITY_REPORT_DIR, `sbom-${TIMESTAMP}.json`));
      
      this.results.checks.push({
        name: 'sbom-generation',
        status: 'completed'
      });

      console.log('✅ SBOM generated successfully');
      return true;
    } catch (error) {
      console.error('❌ SBOM generation failed:', error.message);
      this.results.checks.push({
        name: 'sbom-generation',
        status: 'failed',
        error: error.message
      });
      return false;
    }
  }

  async checkSecurityHeaders() {
    console.log('🔒 Checking security headers configuration...');
    
    const nextConfigPath = path.join(process.cwd(), 'next.config.js');
    const configContent = fs.readFileSync(nextConfigPath, 'utf-8');
    
    const requiredHeaders = [
      'X-Frame-Options',
      'X-Content-Type-Options',
      'X-XSS-Protection',
      'Strict-Transport-Security',
      'Content-Security-Policy',
      'Referrer-Policy',
      'Permissions-Policy'
    ];

    const missingHeaders = requiredHeaders.filter(header => 
      !configContent.includes(header)
    );

    this.results.checks.push({
      name: 'security-headers',
      status: missingHeaders.length === 0 ? 'passed' : 'failed',
      missingHeaders
    });

    if (missingHeaders.length > 0) {
      console.log(`⚠️  Missing security headers: ${missingHeaders.join(', ')}`);
      this.results.passed = false;
    } else {
      console.log('✅ All security headers configured');
    }

    return missingHeaders.length === 0;
  }

  async checkEnvironmentVariables() {
    console.log('🔐 Checking for exposed secrets...');
    
    const envExamplePath = path.join(process.cwd(), '.env.example');
    const gitignorePath = path.join(process.cwd(), '.gitignore');
    
    const checks = {
      envExampleExists: fs.existsSync(envExamplePath),
      envIgnored: false,
      noSecretsInCode: true
    };

    // Check if .env files are in gitignore
    if (fs.existsSync(gitignorePath)) {
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
      checks.envIgnored = gitignoreContent.includes('.env');
    }

    // Check for hardcoded secrets in code
    const suspiciousPatterns = [
      /api[_-]?key\s*=\s*["'][^"']+["']/gi,
      /secret\s*=\s*["'][^"']+["']/gi,
      /password\s*=\s*["'][^"']+["']/gi,
      /token\s*=\s*["'][^"']+["']/gi
    ];

    // Scan source files for potential secrets
    const scanDirectory = (dir) => {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && 
            !file.startsWith('.') && 
            file !== 'node_modules' && 
            file !== 'security-reports') {
          scanDirectory(filePath);
        } else if (stat.isFile() && 
                   (file.endsWith('.ts') || 
                    file.endsWith('.tsx') || 
                    file.endsWith('.js') || 
                    file.endsWith('.jsx'))) {
          const content = fs.readFileSync(filePath, 'utf-8');
          
          for (const pattern of suspiciousPatterns) {
            if (pattern.test(content)) {
              checks.noSecretsInCode = false;
              console.log(`⚠️  Potential secret found in ${filePath}`);
              break;
            }
          }
        }
      }
    };

    // Only scan app and lib directories for performance
    ['app', 'lib', 'components'].forEach(dir => {
      const dirPath = path.join(process.cwd(), dir);
      if (fs.existsSync(dirPath)) {
        scanDirectory(dirPath);
      }
    });

    this.results.checks.push({
      name: 'secrets-check',
      status: checks.envIgnored && checks.noSecretsInCode ? 'passed' : 'failed',
      details: checks
    });

    if (!checks.envIgnored || !checks.noSecretsInCode) {
      this.results.passed = false;
    }

    console.log(checks.noSecretsInCode ? '✅ No hardcoded secrets found' : '❌ Potential secrets detected');
    return checks.envIgnored && checks.noSecretsInCode;
  }

  async generateReport() {
    console.log('\n📊 Generating security report...');
    
    // Determine overall status
    if (this.results.vulnerabilities.critical > 0 || 
        this.results.vulnerabilities.high > 0) {
      this.results.passed = false;
    }

    // Generate markdown report
    const reportContent = `# Security Audit Report

Generated: ${this.results.timestamp}

## Summary

- **Status**: ${this.results.passed ? '✅ PASSED' : '❌ FAILED'}
- **Critical Vulnerabilities**: ${this.results.vulnerabilities.critical}
- **High Vulnerabilities**: ${this.results.vulnerabilities.high}
- **Moderate Vulnerabilities**: ${this.results.vulnerabilities.moderate}
- **Low Vulnerabilities**: ${this.results.vulnerabilities.low}

## Checks Performed

${this.results.checks.map(check => 
  `- **${check.name}**: ${check.status}`
).join('\n')}

## Recommendations

${this.results.vulnerabilities.critical > 0 ? 
  '1. **URGENT**: Fix critical vulnerabilities immediately\n' : ''}
${this.results.vulnerabilities.high > 0 ? 
  '2. Fix high severity vulnerabilities before deployment\n' : ''}
${this.results.checks.some(c => c.name === 'security-headers' && c.status === 'failed') ?
  '3. Configure missing security headers in next.config.js\n' : ''}
${this.results.checks.some(c => c.name === 'secrets-check' && c.status === 'failed') ?
  '4. Review and remove any hardcoded secrets from code\n' : ''}

## Next Steps

1. Run \`npm audit fix\` to automatically fix vulnerabilities
2. Review security-reports directory for detailed findings
3. Update dependencies with known vulnerabilities
4. Configure security headers if missing
5. Implement regular security scanning in CI/CD pipeline
`;

    const reportPath = path.join(SECURITY_REPORT_DIR, `security-report-${TIMESTAMP}.md`);
    fs.writeFileSync(reportPath, reportContent);

    // Save JSON report
    const jsonReportPath = path.join(SECURITY_REPORT_DIR, `security-report-${TIMESTAMP}.json`);
    fs.writeFileSync(jsonReportPath, JSON.stringify(this.results, null, 2));

    console.log(`\n📄 Report saved to: ${reportPath}`);
    console.log(`📄 JSON report saved to: ${jsonReportPath}`);

    return this.results;
  }

  async run() {
    console.log('🚀 Starting Security Audit...\n');
    
    await this.runNpmAudit();
    await this.runBetterNpmAudit();
    await this.generateSBOM();
    await this.checkSecurityHeaders();
    await this.checkEnvironmentVariables();
    
    const report = await this.generateReport();
    
    console.log('\n' + '='.repeat(50));
    console.log(report.passed ? 
      '✅ Security audit PASSED' : 
      '❌ Security audit FAILED - Review report for details');
    console.log('='.repeat(50));
    
    // Exit with error code if failed
    if (!report.passed) {
      process.exit(1);
    }
  }
}

// Run the audit
const auditor = new SecurityAuditor();
auditor.run().catch(error => {
  console.error('Fatal error during security audit:', error);
  process.exit(1);
});