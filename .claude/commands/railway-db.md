# Railway Database Management

Execute SQL commands on Railway production database easily.

## Prerequisites
- Railway CLI installed (`npm install -g @railway/cli`)
- Logged in (`railway login`)
- Project linked (`railway link`)

## Quick Commands

### Check Railway Status
```bash
railway status
```

### Connect to Production Database (Interactive)
```bash
railway connect postgres
```

### Run SQL Command Directly
```bash
railway connect postgres <<'EOF'
YOUR_SQL_HERE;
\q
EOF
```

## Common Operations

### Add Column to Table (Safe - with IF NOT EXISTS)
```bash
railway connect postgres <<'EOF'
ALTER TABLE "TableName" ADD COLUMN IF NOT EXISTS "columnName" TYPE;
\q
EOF
```

### Check Table Schema
```bash
railway connect postgres <<'EOF'
\d "TableName"
\q
EOF
```

### List All Tables
```bash
railway connect postgres <<'EOF'
\dt
\q
EOF
```

### Query Data
```bash
railway connect postgres <<'EOF'
SELECT * FROM "TableName" LIMIT 10;
\q
EOF
```

### Count Rows
```bash
railway connect postgres <<'EOF'
SELECT COUNT(*) FROM "TableName";
\q
EOF
```

## Type Reference (PostgreSQL)

| Prisma Type | PostgreSQL Type |
|-------------|-----------------|
| `String` | `TEXT` |
| `String?` | `TEXT` (nullable) |
| `Int` | `INTEGER` |
| `Float` | `DOUBLE PRECISION` |
| `Boolean` | `BOOLEAN` |
| `DateTime` | `TIMESTAMP(3)` |
| `Json` | `JSONB` |

## Example: Add Multiple Columns
```bash
railway connect postgres <<'EOF'
ALTER TABLE "CourseBloomsAnalysis"
ADD COLUMN IF NOT EXISTS "dokDistribution" JSONB,
ADD COLUMN IF NOT EXISTS "courseType" TEXT,
ADD COLUMN IF NOT EXISTS "courseTypeMatch" DOUBLE PRECISION;
\q
EOF
```

## Safety Rules
1. Always use `IF NOT EXISTS` when adding columns
2. New columns should be nullable OR have defaults
3. Never drop columns without backup
4. Test on local database first

## Troubleshooting

### "nodename nor servname provided" Error
Use `railway connect postgres` instead of `railway run psql`

### Check Connection
```bash
railway status
railway whoami
```
