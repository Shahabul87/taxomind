# 🌐 API & Integration Audit Reference

## What to Check

### 1. API Route Patterns
```bash
# Map all API routes
find app/api -name "route.ts" | sort

# Check HTTP method handling
for route in $(find app/api -name "route.ts"); do
  methods=$(grep -oP "export (async )?function (GET|POST|PUT|PATCH|DELETE)" "$route" | grep -oP "GET|POST|PUT|PATCH|DELETE")
  echo "$route: $methods"
done

# Find routes without proper method exports (catch-all handlers)
find app/api -name "route.ts" -exec grep -L "export.*function.*GET\|export.*function.*POST\|export.*function.*PUT\|export.*function.*DELETE" {} \;

# Check for proper NextResponse usage
grep -rn "return new Response\|return NextResponse" app/api/ --include="*.ts" | head -20
```

### 2. Error Handling Consistency
```bash
# Check for try-catch in API routes
find app/api -name "route.ts" -exec grep -L "try\|catch" {} \; 2>/dev/null

# Check error response format consistency
grep -rn "NextResponse.json.*error\|NextResponse.json.*message" app/api/ --include="*.ts" | head -20

# Check for proper HTTP status codes
grep -rn "NextResponse.json\|new Response" app/api/ --include="*.ts" | grep -oP "status: \d+" | sort | uniq -c | sort -rn

# Find bare throw statements without proper error types
grep -rn "throw new Error\|throw " app/api/ --include="*.ts" | head -10
```

**Expected pattern:**
```ts
try {
  // ... logic
  return NextResponse.json(data)
} catch (error) {
  console.error('[API_NAME]', error)
  return NextResponse.json(
    { error: 'Internal server error' }, // Don't expose details
    { status: 500 }
  )
}
```

### 3. Input Validation
```bash
# Check for Zod validation in API routes
grep -rn "z\.\|zod\|\.parse(\|\.safeParse(" app/api/ --include="*.ts" | head -20

# Find routes accepting body without validation
find app/api -name "route.ts" -exec grep -l "request.json()\|req.body" {} \; | while read f; do
  has_validation=$(grep -c "z\.\|schema\|validate\|parse" "$f")
  if [ "$has_validation" -eq 0 ]; then
    echo "NO VALIDATION: $f"
  fi
done

# Check for query parameter validation
grep -rn "searchParams.get\|url.searchParams" app/api/ --include="*.ts" | grep -v "z\.\|parse\|validate" | head -10
```

### 4. Response Caching
```bash
# Check for cache headers on GET endpoints
grep -rn "Cache-Control\|s-maxage\|stale-while-revalidate" app/api/ --include="*.ts" | head -10

# Check for Next.js revalidation
grep -rn "revalidate\|revalidatePath\|revalidateTag" app/api/ --include="*.ts" | head -10

# Find cacheable GET endpoints without caching
find app/api -name "route.ts" -exec grep -l "GET" {} \; | while read f; do
  has_cache=$(grep -c "Cache-Control\|revalidate\|unstable_cache" "$f")
  if [ "$has_cache" -eq 0 ]; then
    echo "NO CACHE STRATEGY: $f"
  fi
done
```

### 5. Socket.io Configuration
```bash
# Check Socket.io server setup
cat server/index.ts 2>/dev/null | head -50

# Check CORS configuration
grep -rn "cors\|origin" server/ --include="*.ts" | head -10

# Check for room management
grep -rn "join\|leave\|to(\|in(" server/ --include="*.ts" | head -15

# Check for disconnect handling
grep -rn "disconnect\|error\|reconnect" server/ --include="*.ts" | head -10

# Check client-side connection management
grep -rn "io(\|socket.connect\|socket.disconnect" app/ lib/ components/ --include="*.ts" --include="*.tsx" | head -10

# Verify socket connections are cleaned up
grep -rn "socket.disconnect\|socket.off\|socket.removeListener" app/ components/ --include="*.tsx" | head -10
```

### 6. BullMQ Queue Patterns
```bash
# Find queue definitions
grep -rn "new Queue\|new Worker\|new FlowProducer" lib/ app/ --include="*.ts" | head -15

# Check for job retry configuration
grep -rn "attempts:\|backoff:\|removeOnComplete\|removeOnFail" lib/ app/ --include="*.ts" | head -10

# Check for stalled job handling
grep -rn "stalledInterval\|maxStalledCount\|lockDuration" lib/ app/ --include="*.ts" | head -5

# Check queue dashboard/monitoring
grep -rn "bull-board\|arena\|getQueueEvents\|getJobCounts" lib/ app/ --include="*.ts" | head -5
```

### 7. External API Integration
```bash
# Check for timeout configuration on external calls
grep -rn "timeout\|signal.*AbortController\|AbortSignal.timeout" app/ lib/ --include="*.ts" | head -15

# Check for retry logic
grep -rn "retry\|retries\|maxRetries\|exponentialBackoff" app/ lib/ --include="*.ts" | head -10

# Check Anthropic/OpenAI SDK configuration
grep -rn "new Anthropic\|new OpenAI\|anthropic\.\|openai\." lib/ app/ --include="*.ts" | head -15

# Check for streaming response handling
grep -rn "stream\|ReadableStream\|TextEncoder\|createReadableStream" app/api/ lib/ --include="*.ts" | head -15

# Check circuit breaker usage (opossum)
grep -rn "CircuitBreaker\|opossum" lib/ --include="*.ts" | head -10
```

### 8. OpenTelemetry Instrumentation
```bash
# Check OTel setup
find . -name "instrumentation.ts" -o -name "instrumentation.node.ts" | grep -v node_modules | head -5
cat instrumentation.ts 2>/dev/null || cat lib/observability*.ts 2>/dev/null | head -50

# Check span creation in critical paths
grep -rn "startSpan\|trace\.\|tracer\.\|span\." app/ lib/ --include="*.ts" | head -15

# Check for metric recording
grep -rn "meter\.\|counter\.\|histogram\.\|gauge\." lib/ --include="*.ts" | head -10

# Check Sentry integration
grep -rn "Sentry\.\|captureException\|captureMessage\|withScope" app/ lib/ --include="*.ts" | head -15
```

### 9. Webhook Handling
```bash
# Find webhook endpoints
find app/api -path "*webhook*" -name "route.ts" | head -10

# Check webhook signature verification
grep -rn "verify\|signature\|constructEvent\|hmac\|webhook.*secret" app/api/ --include="*.ts" | head -15

# Check for idempotency handling
grep -rn "idempotenc\|eventId\|dedup\|already.*processed" app/api/ --include="*.ts" | head -10

# Check webhook retry handling
grep -rn "retry\|attempt\|webhook.*failed" app/api/ --include="*.ts" | head -5
```

### 10. API Documentation & Consistency
```bash
# Check for consistent response shapes
grep -rn "NextResponse.json" app/api/ --include="*.ts" | head -30 | grep -oP 'json\([^)]+\)' | head -20

# Check for API versioning
find app/api -type d | grep "v1\|v2\|version" | head -5

# Check for OpenAPI/Swagger docs
find . -name "swagger*" -o -name "openapi*" | grep -v node_modules | head -5
```

## Integration-Specific Checks

### Stripe Integration
```bash
grep -rn "stripe\." app/ lib/ --include="*.ts" | grep -v node_modules | head -20

# Verify: webhook signature, idempotency, price from server not client
# Check for proper error handling on payment flows
grep -rn "stripe.*catch\|PaymentIntent\|checkout.sessions" app/ lib/ --include="*.ts" | head -10
```

### Resend (Email)
```bash
grep -rn "resend\.\|Resend(" lib/ app/ --include="*.ts" | head -10
# Check: rate limiting on email sends, template sanitization, error handling
```

### Twilio (SMS)
```bash
grep -rn "twilio\|Twilio" lib/ app/ --include="*.ts" | head -10
# Check: rate limiting, input validation on phone numbers, webhook verification
```

### Firebase Admin
```bash
grep -rn "firebase-admin\|admin.auth\|admin.messaging" lib/ app/ --include="*.ts" | head -10
# Check: service account key not in client bundle, proper initialization
```

## Scoring

| Check | Weight | Score Criteria |
|-------|--------|---------------|
| Error Handling | 20% | All routes have try-catch, consistent format |
| Input Validation | 20% | All body/params validated with Zod |
| Auth Coverage | 15% | All mutation routes require auth |
| Caching Strategy | 15% | GET routes have explicit cache config |
| External API Safety | 15% | Timeouts, retries, circuit breakers |
| WebSocket Health | 10% | CORS, auth, cleanup, room management |
| Observability | 5% | Key paths instrumented |
