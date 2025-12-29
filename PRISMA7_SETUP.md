# Prisma 7 Setup Guide

## Overview

This project uses **Prisma 7** with the **PostgreSQL adapter** for optimal Vercel deployment. The adapter approach provides:

- ✅ Connection pooling for serverless environments
- ✅ Better performance with long-running queries
- ✅ No additional paid services required
- ✅ Compatible with Vercel's serverless functions

## Architecture

```
┌─────────────────┐
│   Next.js API   │
│    Routes       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Prisma Client  │
│   with Adapter  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   pg Pool       │
│  (Connection    │
│   Pooling)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PostgreSQL    │
│    Database     │
└─────────────────┘
```

## Setup Steps

### 1. Install Dependencies

```bash
cd ai-chatbot
npm install
```

This will install:

- `@prisma/adapter-pg` - PostgreSQL adapter for Prisma 7
- `pg` - PostgreSQL client for Node.js
- `@prisma/client` - Prisma Client

### 2. Configure Environment Variables

Create `.env.local` file in the `ai-chatbot` directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/chatbot_db"

# OpenAI API Configuration
OPENAI_API_KEY="your-openai-api-key-here"

# Optional: LLM Configuration
LLM_MODEL="gpt-3.5-turbo"
MAX_TOKENS="500"
LLM_TIMEOUT="30000"

# Node Environment
NODE_ENV="development"
```

### 3. Generate Prisma Client

```bash
npm run db:generate
```

### 4. Run Database Migrations

```bash
npm run db:migrate
```

### 5. Start Development Server

```bash
npm run dev
```

## Configuration Details

### Database Connection Pool (`lib/db.ts`)

```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10, // Maximum pool size
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 10000, // Connection timeout 10s
});
```

**Pool Settings Explained:**

- `max: 10` - Allows up to 10 concurrent database connections
- `idleTimeoutMillis: 30000` - Closes idle connections after 30 seconds
- `connectionTimeoutMillis: 10000` - Fails if connection takes > 10 seconds

### Prisma Client Configuration

```typescript
new PrismaClient({
  adapter, // Uses PostgreSQL adapter with connection pool
  log: ["query", "error", "warn"], // Development logging
});
```

## Vercel Production Deployment

### Environment Variables

Add these to your Vercel project settings:

1. **DATABASE_URL**

   ```
   postgresql://user:password@host:5432/database?pgbouncer=true
   ```

   - Use connection pooler (PgBouncer) for production
   - Recommended: Vercel Postgres, Supabase, or Neon

2. **OPENAI_API_KEY**

   ```
   sk-...your-key...
   ```

3. **Optional Settings**
   ```
   LLM_MODEL=gpt-3.5-turbo
   MAX_TOKENS=500
   LLM_TIMEOUT=30000
   ```

### Recommended Database Providers for Vercel

1. **Vercel Postgres** (Built-in)

   - Native integration
   - Built-in connection pooling
   - Easy setup

2. **Supabase**

   - Free tier available
   - Connection pooling included
   - Good performance

3. **Neon**
   - Serverless PostgreSQL
   - Auto-scaling
   - Connection pooling

### Build Configuration

No special build configuration needed. The adapter handles serverless optimization automatically.

## Troubleshooting

### Error: "adapter or accelerateUrl required"

**Cause:** Prisma Client not regenerated after adapter setup.

**Fix:**

```bash
npm run db:generate
rm -rf .next
npm run dev
```

### Error: "Connection pool exhausted"

**Cause:** Too many concurrent connections.

**Fix:** Increase pool size in `lib/db.ts`:

```typescript
max: 20; // Increase from 10 to 20
```

### Error: "Connection timeout"

**Cause:** Database unreachable or slow.

**Fix:**

1. Verify `DATABASE_URL` is correct
2. Check database is running
3. Increase timeout:

```typescript
connectionTimeoutMillis: 20000; // Increase to 20s
```

### Slow Queries on Vercel

**Cause:** Cold starts or connection overhead.

**Fix:**

1. Use connection pooler (PgBouncer)
2. Add `?pgbouncer=true` to DATABASE_URL
3. Consider using Prisma Accelerate for caching (paid)

## Migration from Prisma 6

If upgrading from Prisma 6:

1. Remove `url` from `schema.prisma` datasource
2. Update `lib/db.ts` with adapter configuration
3. Install new dependencies
4. Regenerate Prisma Client
5. Test locally before deploying

## Performance Tips

1. **Connection Pooling**: Always use pooling in production
2. **Query Optimization**: Use `select` to limit returned fields
3. **Indexing**: Ensure proper indexes on frequently queried fields
4. **Caching**: Consider Redis for frequently accessed data
5. **Monitoring**: Use Prisma Studio or database logs to monitor performance

## Additional Resources

- [Prisma 7 Documentation](https://www.prisma.io/docs)
- [PostgreSQL Adapter Guide](https://pris.ly/d/prisma7-client-config)
- [Vercel Postgres Docs](https://vercel.com/docs/storage/vercel-postgres)
- [Connection Pooling Best Practices](https://pris.ly/d/connection-pooling)
