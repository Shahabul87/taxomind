# Security Incidents Runbook

## Overview
This runbook provides procedures for responding to security incidents in the Taxomind application. Follow these procedures exactly to minimize damage and ensure proper incident handling.

## Quick Reference
- **Security Hotline**: security@taxomind.com
- **Incident Command**: Use `#security-incident` Slack channel
- **Evidence Collection**: `/var/log/security/`
- **Legal Contact**: legal@taxomind.com
- **Law Enforcement**: Contact legal team first

## CRITICAL: First Response Actions

### Immediate Actions (First 15 Minutes)
```bash
# 1. Isolate the threat
iptables -I INPUT -s <suspicious_ip> -j DROP

# 2. Preserve evidence
tar -czf /tmp/incident_$(date +%Y%m%d_%H%M%S).tar.gz /var/log/

# 3. Notify security team
curl -X POST $SECURITY_WEBHOOK -d '{"alert": "Security incident detected"}'

# 4. Enable enhanced logging
echo "1" > /proc/sys/kernel/audit_enabled

# 5. Document everything
echo "$(date): Incident detected - <description>" >> /var/log/security/incident.log
```

## Incident Types and Responses

### 1. Unauthorized Access Attempt

#### Indicators
- Multiple failed login attempts
- Unusual access patterns
- Access from blacklisted IPs
- Privilege escalation attempts

#### Quick Diagnostics
```bash
# Check failed login attempts
grep "Failed password" /var/log/auth.log | tail -50

# Check database for suspicious login patterns
psql $DATABASE_URL -c "
SELECT email, COUNT(*) as attempts, MAX(created_at) as last_attempt
FROM audit_logs
WHERE action = 'LOGIN_FAILED'
AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY email
HAVING COUNT(*) > 5
ORDER BY attempts DESC;"

# Check for brute force attempts
fail2ban-client status
fail2ban-client status sshd

# Review NextAuth logs
grep "NEXTAUTH" /var/log/application.log | grep -E "error|failed"
```

#### Response Steps

1. **Block Suspicious IPs**
```bash
# Immediate IP blocking
iptables -A INPUT -s <malicious_ip> -j DROP
iptables-save > /etc/iptables/rules.v4

# Add to permanent blacklist
echo "<malicious_ip>" >> /etc/blacklist.txt

# Update Cloudflare firewall
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/firewall/access_rules/rules" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "mode": "block",
    "configuration": {
      "target": "ip",
      "value": "<malicious_ip>"
    },
    "notes": "Security incident - automated block"
  }'
```

2. **Lock Affected Accounts**
```typescript
// Immediately disable compromised accounts
async function lockAccount(userId: string, reason: string) {
  await db.$transaction(async (tx) => {
    // Disable account
    await tx.user.update({
      where: { id: userId },
      data: { 
        isLocked: true,
        lockedAt: new Date(),
        lockReason: reason
      }
    });
    
    // Invalidate all sessions
    await tx.session.deleteMany({
      where: { userId }
    });
    
    // Log security event
    await tx.securityLog.create({
      data: {
        userId,
        action: 'ACCOUNT_LOCKED',
        reason,
        metadata: {
          timestamp: new Date(),
          automated: true
        }
      }
    });
  });
  
  // Notify user
  await sendSecurityAlert(userId, 'Your account has been locked for security reasons');
}
```

3. **Force Password Reset**
```typescript
// Force password reset for affected users
async function forcePasswordReset(userIds: string[]) {
  for (const userId of userIds) {
    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    
    await db.passwordResetToken.create({
      data: {
        userId,
        token,
        expires: new Date(Date.now() + 3600000), // 1 hour
        forced: true
      }
    });
    
    // Invalidate current password
    await db.user.update({
      where: { id: userId },
      data: { 
        passwordResetRequired: true,
        password: null // Clear password hash
      }
    });
    
    // Send notification
    await sendPasswordResetEmail(userId, token);
  }
}
```

### 2. Data Breach Detected

#### Indicators
- Unauthorized data exports
- Unusual database queries
- Large data transfers
- Sensitive data in logs

#### Quick Diagnostics
```bash
# Check for data exports
grep -E "SELECT.*FROM.*(users|payments|sensitive)" /var/log/postgresql/*.log

# Monitor outbound traffic
netstat -an | grep ESTABLISHED | awk '{print $5}' | cut -d: -f1 | sort | uniq -c | sort -rn

# Check for bulk data access
psql $DATABASE_URL -c "
SELECT query, calls, mean_exec_time, rows
FROM pg_stat_statements
WHERE rows > 1000
AND query LIKE '%SELECT%'
ORDER BY rows DESC
LIMIT 20;"

# Audit S3/Cloud storage access
aws s3api list-objects --bucket taxomind-backups --query 'Contents[?LastModified>=`2024-01-15`]'
```

#### Response Steps

1. **Immediate Containment**
```bash
# Revoke all database sessions
psql $DATABASE_URL -c "
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE pid <> pg_backend_pid();"

# Rotate all credentials immediately
export NEW_DB_PASSWORD=$(openssl rand -base64 32)
psql $DATABASE_URL -c "ALTER USER taxomind_app PASSWORD '$NEW_DB_PASSWORD';"

# Update application with new credentials
kubectl create secret generic db-credentials \
  --from-literal=password=$NEW_DB_PASSWORD \
  --dry-run=client -o yaml | kubectl apply -f -

# Restart all services
kubectl rollout restart deployment/taxomind-api
```

2. **Data Breach Assessment**
```typescript
// Identify affected data
async function assessDataBreach() {
  const assessment = {
    affectedUsers: [],
    dataTypes: [],
    timeframe: {},
    severity: 'unknown'
  };
  
  // Check audit logs for data access
  const suspiciousQueries = await db.auditLog.findMany({
    where: {
      action: 'DATA_ACCESS',
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
      },
      metadata: {
        path: ['rowCount'],
        gte: 100
      }
    }
  });
  
  // Identify affected users
  for (const query of suspiciousQueries) {
    const affectedUserIds = await db.$queryRaw`
      SELECT DISTINCT user_id 
      FROM ${query.tableName}
      WHERE updated_at >= ${query.createdAt}`;
    
    assessment.affectedUsers.push(...affectedUserIds);
  }
  
  // Determine data types exposed
  assessment.dataTypes = [...new Set(suspiciousQueries.map(q => q.tableName))];
  
  // Calculate severity
  if (assessment.dataTypes.includes('payments') || 
      assessment.dataTypes.includes('users')) {
    assessment.severity = 'CRITICAL';
  }
  
  return assessment;
}
```

3. **Legal and Compliance Actions**
```typescript
// GDPR breach notification
async function notifyDataBreach(assessment: BreachAssessment) {
  // Notify authorities within 72 hours (GDPR requirement)
  if (assessment.severity === 'CRITICAL') {
    await notifyDataProtectionAuthority({
      incidentDate: new Date(),
      discoveryDate: new Date(),
      affectedCount: assessment.affectedUsers.length,
      dataTypes: assessment.dataTypes,
      measures: 'Account locks, password resets, encryption review',
      crossBorder: true
    });
  }
  
  // Notify affected users
  for (const userId of assessment.affectedUsers) {
    await db.notification.create({
      data: {
        userId,
        type: 'SECURITY_BREACH',
        title: 'Important Security Update',
        message: 'We detected unusual activity on your account...',
        priority: 'CRITICAL'
      }
    });
    
    await sendBreachNotificationEmail(userId);
  }
  
  // Document for compliance
  await db.incidentReport.create({
    data: {
      type: 'DATA_BREACH',
      severity: assessment.severity,
      affectedUsers: assessment.affectedUsers.length,
      reportedToAuthorities: true,
      details: assessment
    }
  });
}
```

### 3. SQL Injection Attack

#### Indicators
- Unusual SQL patterns in logs
- Database errors in application logs
- Unexpected data modifications
- Union/concat operations in user input

#### Quick Diagnostics
```bash
# Check for SQL injection patterns
grep -E "(UNION|SELECT.*FROM|DROP|INSERT|UPDATE|DELETE|'--|;--)" /var/log/nginx/access.log

# Review Prisma query logs
grep "prisma:query" /var/log/application.log | grep -E "OR.*=|'.*'"

# Check for database structure queries
psql $DATABASE_URL -c "
SELECT query 
FROM pg_stat_statements 
WHERE query LIKE '%information_schema%' 
   OR query LIKE '%pg_catalog%';"
```

#### Response Steps

1. **Block Attack Vectors**
```typescript
// Implement SQL injection protection
import { sql } from '@prisma/client/sql';

// Safe parameterized query
const safeQuery = async (userId: string) => {
  // Never use string concatenation!
  // ❌ UNSAFE
  // const result = await db.$queryRaw(`SELECT * FROM users WHERE id = '${userId}'`);
  
  // ✅ SAFE - Use parameterized queries
  const result = await db.$queryRaw`
    SELECT * FROM users WHERE id = ${userId}`;
  
  return result;
};

// Add input validation middleware
export function validateSQLInput(req: Request, res: Response, next: NextFunction) {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b)/gi,
    /(--|\/\*|\*\/|xp_|sp_|0x)/gi,
    /(\bOR\b\s*\d+\s*=\s*\d+)/gi,
    /('\s*OR\s+')/gi
  ];
  
  const body = JSON.stringify(req.body);
  const query = JSON.stringify(req.query);
  
  for (const pattern of sqlPatterns) {
    if (pattern.test(body) || pattern.test(query)) {
      // Log attack attempt
      logger.security({
        type: 'SQL_INJECTION_ATTEMPT',
        ip: req.ip,
        path: req.path,
        payload: { body: req.body, query: req.query }
      });
      
      // Block request
      return res.status(403).json({ error: 'Forbidden' });
    }
  }
  
  next();
}
```

2. **Audit and Repair**
```sql
-- Check for unauthorized schema changes
SELECT 
  schemaname,
  tablename,
  tableowner,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Look for suspicious new tables
SELECT 
  table_name,
  table_schema,
  pg_stat_user_tables.n_tup_ins as inserts,
  pg_stat_user_tables.n_tup_upd as updates
FROM information_schema.tables
LEFT JOIN pg_stat_user_tables ON table_name = relname
WHERE table_schema = 'public'
  AND table_name NOT IN (
    'users', 'courses', 'chapters', 'enrollments', -- known tables
    'purchases', 'categories', 'reviews'
  );

-- Restore from backup if compromised
pg_restore -U postgres -d taxomind_restore backup_clean.sql
```

### 4. XSS Attack Detected

#### Indicators
- Script tags in user input
- JavaScript in database content
- Unusual client-side errors
- Modified DOM elements

#### Quick Diagnostics
```bash
# Check for XSS patterns in logs
grep -E "<script|javascript:|onerror=|onclick=" /var/log/nginx/access.log

# Search database for stored XSS
psql $DATABASE_URL -c "
SELECT id, title, description 
FROM courses 
WHERE description LIKE '%<script%' 
   OR description LIKE '%javascript:%' 
   OR title LIKE '%<script%';"

# Check user-generated content
psql $DATABASE_URL -c "
SELECT id, content 
FROM comments 
WHERE content ~* '<[^>]*(onclick|onerror|onload|javascript)'"
```

#### Response Steps

1. **Sanitize Content**
```typescript
// Implement XSS protection
import DOMPurify from 'isomorphic-dompurify';
import { escape } from 'lodash';

// Sanitize user input
export function sanitizeInput(input: string): string {
  // Remove dangerous HTML
  const cleaned = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  });
  
  return cleaned;
}

// Clean existing data
async function cleanStoredXSS() {
  const affected = await db.$queryRaw`
    SELECT id, content 
    FROM comments 
    WHERE content ~* '<[^>]*(script|onclick|onerror)'`;
  
  for (const record of affected) {
    const cleaned = sanitizeInput(record.content);
    await db.comment.update({
      where: { id: record.id },
      data: { content: cleaned }
    });
  }
}

// Add Content Security Policy
export function setSecurityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https://api.taxomind.com; " +
    "frame-ancestors 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';"
  );
  
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  
  next();
}
```

### 5. DDoS Attack

#### Indicators
- Sudden traffic spike
- High CPU/memory usage
- Connection pool exhaustion
- Service unavailability

#### Quick Diagnostics
```bash
# Check connection count
netstat -an | grep -c ESTABLISHED

# Identify top IPs
netstat -an | grep ESTABLISHED | awk '{print $5}' | cut -d: -f1 | sort | uniq -c | sort -rn | head -20

# Check request rate
tail -f /var/log/nginx/access.log | awk '{print $1}' | sort | uniq -c | sort -rn

# Monitor bandwidth
iftop -i eth0
```

#### Response Steps

1. **Enable DDoS Protection**
```bash
# Enable Cloudflare Under Attack mode
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/security_level" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"value":"under_attack"}'

# Rate limiting with iptables
iptables -A INPUT -p tcp --dport 443 -m state --state NEW -m limit --limit 50/second --limit-burst 100 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -m state --state NEW -j DROP

# Enable SYN cookies
echo 1 > /proc/sys/net/ipv4/tcp_syncookies

# Increase backlog
echo 2048 > /proc/sys/net/core/netdev_max_backlog
```

2. **Application-Level Protection**
```typescript
// Implement aggressive rate limiting
import { Ratelimit } from "@upstash/ratelimit";

const ddosLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 s"), // 10 requests per second
  analytics: true,
});

export async function ddosProtection(req: Request): Promise<Response | null> {
  const ip = req.headers.get('CF-Connecting-IP') || 
             req.headers.get('X-Forwarded-For') || 
             'unknown';
  
  const { success, remaining, reset } = await ddosLimiter.limit(ip);
  
  if (!success) {
    // Log potential DDoS
    await logSecurityEvent({
      type: 'DDOS_BLOCKED',
      ip,
      timestamp: new Date(),
      path: req.url
    });
    
    return new Response('Too Many Requests', { 
      status: 429,
      headers: {
        'Retry-After': String(Math.floor((reset - Date.now()) / 1000))
      }
    });
  }
  
  return null;
}
```

### 6. Malware/Ransomware Detection

#### Indicators
- Encrypted files
- Unusual file modifications
- Suspicious processes
- Ransom notes

#### Quick Diagnostics
```bash
# Check for encrypted files
find / -name "*.encrypted" -o -name "*.locked" 2>/dev/null

# Monitor file changes
inotifywatch -r -e modify,create,delete /var/www/

# Check for suspicious processes
ps aux | grep -E "crypto|miner|ransom"

# Review recent file modifications
find /var/www -type f -mtime -1 -ls
```

#### Response Steps

1. **Immediate Isolation**
```bash
# Disconnect from network
ifconfig eth0 down

# Stop all services
systemctl stop taxomind

# Create forensic backup
dd if=/dev/sda of=/external/forensic_backup.img bs=4M

# Mount read-only
mount -o remount,ro /
```

2. **Recovery Procedures**
```bash
# Restore from clean backup
# Verify backup integrity first
sha256sum -c backup.sha256

# Restore application
tar -xzf backup_clean.tar.gz -C /var/www/

# Restore database
pg_restore -U postgres -d taxomind backup_clean.sql

# Regenerate all secrets
./scripts/rotate-all-secrets.sh

# Rebuild and redeploy
docker build -t taxomind:clean .
docker run -d --name taxomind-clean taxomind:clean
```

## Security Tools and Commands

### Monitoring Tools
```bash
# Real-time monitoring
tail -f /var/log/auth.log | grep -E "Failed|Invalid|error"

# Check for rootkits
rkhunter --check

# Scan for vulnerabilities
nikto -h https://taxomind.com

# Check SSL/TLS configuration
sslscan taxomind.com

# Audit system calls
auditctl -l
ausearch -m USER_LOGIN --success no
```

### Forensics Commands
```bash
# Capture network traffic
tcpdump -i eth0 -w capture.pcap

# Check system integrity
tripwire --check

# Review command history
history | grep -E "sudo|passwd|ssh"

# Check for backdoors
netstat -tulpn | grep LISTEN

# Find recently modified files
find / -mtime -1 -type f 2>/dev/null
```

## Evidence Collection

### What to Collect
1. **System Logs**
```bash
/var/log/auth.log
/var/log/syslog
/var/log/nginx/*.log
/var/log/postgresql/*.log
/var/log/application/*.log
```

2. **Database Evidence**
```sql
-- Export audit logs
COPY (SELECT * FROM audit_logs WHERE created_at > NOW() - INTERVAL '48 hours')
TO '/tmp/audit_export.csv' CSV HEADER;

-- Export security events
COPY (SELECT * FROM security_logs)
TO '/tmp/security_export.csv' CSV HEADER;
```

3. **Memory Dumps**
```bash
# Capture memory dump
gcore -o /tmp/memory_dump <pid>

# Or use LiME for full system memory
insmod lime.ko "path=/tmp/memory.lime format=lime"
```

### Chain of Custody
```bash
# Create evidence package with hash
tar -czf evidence_$(date +%Y%m%d_%H%M%S).tar.gz /tmp/evidence/
sha256sum evidence_*.tar.gz > evidence.sha256

# Sign with GPG
gpg --sign evidence.sha256

# Document chain of custody
echo "$(date): Evidence collected by $(whoami)" >> chain_of_custody.log
echo "SHA256: $(cat evidence.sha256)" >> chain_of_custody.log
```

## Communication Templates

### Internal Communication
```markdown
Subject: [SECURITY] Incident Detected - [Type]

Team,

We have detected a security incident requiring immediate attention.

**Incident Type:** [SQL Injection/XSS/Data Breach/etc]
**Severity:** [Critical/High/Medium]
**Detection Time:** [Timestamp]
**Affected Systems:** [List]

**Immediate Actions Taken:**
- [Action 1]
- [Action 2]

**Required Actions:**
- Engineering: [Tasks]
- Security: [Tasks]
- Legal: [Tasks]

Join #security-incident channel for coordination.

[Your Name]
```

### Customer Communication
```markdown
Subject: Important Security Update

Dear Customer,

We recently detected unusual activity on our platform and took immediate action to protect your account.

**What Happened:**
[Brief, non-technical explanation]

**What We Did:**
- Immediately secured all accounts
- Reset passwords as a precaution
- Enhanced our security measures

**What You Should Do:**
1. Reset your password using the link we sent
2. Review your recent account activity
3. Enable two-factor authentication

We take security seriously and apologize for any inconvenience.

The Taxomind Security Team
```

## Legal and Compliance

### GDPR Requirements
- Notify authorities within 72 hours
- Document the breach thoroughly
- Notify affected users without undue delay
- Maintain breach register

### Evidence Preservation
- Do not modify original evidence
- Create forensic copies
- Document all actions taken
- Maintain chain of custody

### Law Enforcement
- Contact legal team before engaging
- Preserve all evidence
- Document all communications
- Provide only requested information

## Post-Incident Actions

### Immediate (Within 24 hours)
1. Complete incident report
2. Patch vulnerabilities
3. Update security rules
4. Notify stakeholders

### Short-term (Within 1 week)
1. Conduct post-mortem
2. Update security policies
3. Implement additional monitoring
4. Security training for team

### Long-term (Within 1 month)
1. Security audit
2. Penetration testing
3. Update incident response plan
4. Review and update all security measures

## Security Contacts

- **Security Team Lead**: security-lead@taxomind.com
- **CISO**: ciso@taxomind.com
- **Legal Team**: legal@taxomind.com
- **External Security Firm**: +1-xxx-xxx-xxxx
- **FBI Cyber Crime**: https://www.ic3.gov
- **Data Protection Authority**: [Local DPA contact]

## Security Resources

- **OWASP Top 10**: https://owasp.org/Top10/
- **NIST Cybersecurity Framework**: https://www.nist.gov/cyberframework
- **SANS Incident Handling**: https://www.sans.org/incident-handling
- **CVE Database**: https://cve.mitre.org/

---
*Last Updated: January 2025*
*Version: 1.0*
*Classification: CONFIDENTIAL*
*Next Review: February 2025*

**Remember: In case of a security incident, stay calm, document everything, and follow this runbook exactly.**