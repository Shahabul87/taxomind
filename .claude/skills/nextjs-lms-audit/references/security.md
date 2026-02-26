# 🔒 Security Vulnerability Audit Reference

## What to Check

### 1. Dependency Vulnerabilities
```bash
# Run npm audit
npm audit --json 2>/dev/null | node -pe "
  const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
  const v = d.vulnerabilities || {};
  const summary = {critical:0, high:0, moderate:0, low:0};
  Object.values(v).forEach(x => summary[x.severity]++);
  JSON.stringify(summary, null, 2)
"

# Check for known problematic versions
node -pe "
  const pkg = require('./package.json');
  const checks = {
    'next-auth': {current: pkg.dependencies['next-auth'], note: 'beta — check for auth bypass CVEs'},
    'jsonwebtoken': {current: pkg.dependencies['jsonwebtoken'], note: 'check for JWT forgery CVEs'},
    'axios': {current: pkg.dependencies['axios'], note: 'check SSRF vulnerabilities'},
    'sharp': {current: pkg.dependencies['sharp'], note: 'native binary — check for buffer overflow'},
  };
  JSON.stringify(checks, null, 2)
"
```

### 2. Environment Variable Exposure
```bash
# Check for secrets in client-side code (CRITICAL)
# Next.js only exposes NEXT_PUBLIC_ vars to client
grep -rn "process.env\." app/ components/ --include="*.tsx" --include="*.ts" | grep -v "'use server'\|server-only\|api/\|actions/" | grep -v "NEXT_PUBLIC_" | head -20

# Check .env files aren't committed
git log --all --full-history -- ".env" ".env.local" ".env.production" 2>/dev/null | head -5

# Check .gitignore for env files
grep -n "\.env" .gitignore 2>/dev/null

# Check for hardcoded secrets
grep -rn "sk-\|sk_live_\|sk_test_\|whsec_\|AKIA\|password.*=.*['\"]" app/ lib/ components/ --include="*.ts" --include="*.tsx" | grep -v ".env\|.example\|test\|mock\|placeholder" | head -10

# Check for secret in next.config
grep -n "API_KEY\|SECRET\|PASSWORD\|TOKEN\|PRIVATE" next.config.* 2>/dev/null | grep -v "process.env"
```

### 3. Authentication & Authorization
```bash
# Check NextAuth configuration
find . -path "*/auth*" -name "*.ts" -o -name "*.tsx" | grep -v node_modules | head -20
cat app/api/auth/\[...nextauth\]/route.ts 2>/dev/null || cat lib/auth.ts 2>/dev/null || cat auth.ts 2>/dev/null

# Check for unprotected API routes
find app/api -name "route.ts" -exec grep -L "getServerSession\|auth(\|getToken\|NextAuth\|middleware\|verify" {} \; 2>/dev/null

# Check middleware auth coverage
cat middleware.ts 2>/dev/null | grep -n "matcher\|config\|if\|redirect\|NextResponse"

# Check for role-based access control
grep -rn "role\|isAdmin\|permission\|authorize\|RBAC\|capability" app/api/ lib/ --include="*.ts" | head -15
```

### 4. XSS Prevention
```bash
# Check for dangerouslySetInnerHTML usage
grep -rn "dangerouslySetInnerHTML" app/ components/ --include="*.tsx" | head -10

# Check for DOMPurify/sanitization near dangerous HTML
grep -rn "DOMPurify\|sanitize\|isomorphic-dompurify\|purify" app/ lib/ components/ --include="*.ts" --include="*.tsx" | head -10

# Check react-markdown/html-react-parser usage (safe by default but check rehype-raw)
grep -rn "rehype-raw\|html-react-parser\|parse(html\|dangerouslySetInnerHTML" app/ components/ --include="*.tsx" | head -10

# Check for eval() or Function() constructor
grep -rn "eval(\|new Function(\|setTimeout(.*string\|setInterval(.*string" app/ lib/ components/ --include="*.ts" --include="*.tsx" | head -5
```

### 5. CSRF Protection
```bash
# Check for CSRF tokens on mutation endpoints
grep -rn "csrf\|CSRF\|csrfToken\|_csrf" app/ lib/ --include="*.ts" | head -10

# Check if POST/PUT/DELETE routes validate origin
grep -rn "request.headers.get.*origin\|request.headers.get.*referer\|allowedOrigins" app/api/ --include="*.ts" | head -10

# Check NextAuth CSRF configuration
grep -rn "csrf\|CSRF" lib/auth* auth* --include="*.ts" 2>/dev/null
```

### 6. Content Security Policy
```bash
# Check for CSP headers
grep -rn "Content-Security-Policy\|CSP\|contentSecurityPolicy" next.config.* middleware.ts lib/ --include="*.ts" --include="*.mjs" --include="*.js" 2>/dev/null | head -10

# Check for the CSP validation script
cat scripts/validate-csp.js 2>/dev/null | head -30

# Check headers configuration
grep -rn "headers\(\)\|async headers" next.config.* 2>/dev/null
```

### 7. SQL/Prisma Injection
```bash
# Check for raw SQL queries (injection risk)
grep -rn "\$queryRaw\|\$executeRaw\|queryRawUnsafe\|executeRawUnsafe" app/ lib/ --include="*.ts" | head -10

# Check for Prisma parameterized vs string interpolation in raw queries
grep -rn "queryRaw\`\|executeRaw\`" app/ lib/ --include="*.ts" | head -10
# Tagged template literals are SAFE (parameterized)
# String concatenation in $queryRawUnsafe is DANGEROUS

# Check for user input flowing into queries without validation
grep -rn "req.body\|req.query\|searchParams\|formData" app/api/ --include="*.ts" -A 5 | grep -i "prisma\|where\|findMany\|findFirst" | head -10
```

### 8. Rate Limiting
```bash
# Check rate limiting implementation
grep -rn "ratelimit\|rate-limit\|rateLimiter\|RateLimiter\|Ratelimit" app/ lib/ --include="*.ts" | head -15

# Check which API routes have rate limiting
find app/api -name "route.ts" -exec grep -l "ratelimit\|rateLimiter" {} \; 2>/dev/null

# Critical endpoints that MUST have rate limiting:
# - /api/auth/* (login, register, password reset)
# - /api/stripe/* (webhook, checkout)
# - /api/ai/* (LLM calls — expensive!)
# - /api/upload/* (file uploads)

# Check Upstash rate limiter configuration
grep -rn "Ratelimit\|slidingWindow\|fixedWindow\|tokenBucket" lib/ --include="*.ts" | head -10
```

### 9. Stripe Security
```bash
# Check webhook signature verification
grep -rn "stripe.webhooks.constructEvent\|webhook.*verify\|whsec_" app/api/ lib/ --include="*.ts" | head -10

# Check for Stripe secret key exposure
grep -rn "sk_live_\|sk_test_" app/ components/ --include="*.tsx" --include="*.ts" | grep -v "process.env\|.env" | head -5

# Check checkout session creation (ensure price comes from server, not client)
grep -rn "stripe.checkout.sessions.create\|stripe.prices" app/api/ lib/ --include="*.ts" | head -10
```

### 10. File Upload Security
```bash
# Check upload handling
grep -rn "upload\|multer\|formidable\|cloudinary.*upload\|CldUploadWidget" app/ lib/ components/ --include="*.ts" --include="*.tsx" | head -15

# Check for file type validation
grep -rn "mimetype\|content-type\|fileType\|allowedTypes\|accept=" app/ lib/ components/ --include="*.ts" --include="*.tsx" | head -10

# Check for file size limits
grep -rn "maxFileSize\|sizeLimit\|bodyParser.*limit\|maxBodyLength" app/ lib/ next.config.* --include="*.ts" --include="*.mjs" | head -10
```

### 11. API Route Security Patterns
```bash
# Check for proper error handling (don't leak stack traces)
grep -rn "catch\|error\|500" app/api/ --include="*.ts" | grep -v "node_modules" | head -20

# Check if errors expose internal details
grep -rn "error.message\|error.stack\|JSON.stringify(error)" app/api/ --include="*.ts" | head -10

# Check for server-only imports
grep -rn "import.*server-only" app/ lib/ --include="*.ts" | head -10
```

### 12. Socket.io Security
```bash
# Check Socket.io CORS configuration
grep -rn "cors\|origin\|CORS" server/ --include="*.ts" | head -10

# Check for authentication on WebSocket connections
grep -rn "socket.*auth\|io.use\|middleware\|handshake" server/ --include="*.ts" | head -10

# Check for input validation on socket events
grep -rn "socket.on(" server/ --include="*.ts" | head -20
```

## Severity Classifications

| Finding | Severity |
|---------|----------|
| Exposed API keys/secrets in client bundle | 🔴 Critical |
| Unprotected admin API routes | 🔴 Critical |
| SQL injection via `$queryRawUnsafe` with user input | 🔴 Critical |
| No Stripe webhook verification | 🔴 Critical |
| Missing auth on data-mutation endpoints | 🟠 High |
| No rate limiting on auth/AI endpoints | 🟠 High |
| XSS via `dangerouslySetInnerHTML` without sanitization | 🟠 High |
| Missing CSP headers | 🟡 Medium |
| Overly permissive CORS on Socket.io | 🟡 Medium |
| Error responses leaking stack traces | 🟡 Medium |
| No CSRF protection on forms | 🟡 Medium |
| Missing file type/size validation | 🟡 Medium |
| npm audit moderate vulnerabilities | 🟢 Low |
| Console.log with sensitive data | 🟢 Low |
