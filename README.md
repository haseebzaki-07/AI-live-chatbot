# AI Live Chatbot

A production-ready AI-powered customer support chatbot built with Next.js, PostgreSQL, and OpenAI. Features multi-channel support architecture, Redis caching, and extensible tool integrations.

## Table of Contents

- [Getting Started](#getting-started)
- [Local Development](#local-development)
- [Database Setup](#database-setup)
- [Environment Configuration](#environment-configuration)
- [Architecture Overview](#architecture-overview)
- [LLM Implementation](#llm-implementation)
- [Trade-offs & Future Improvements](#trade-offs--future-improvements)

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** database (local or cloud like NeonDB)
- **OpenAI API Key** (get one at [platform.openai.com](https://platform.openai.com))
- **Upstash Redis** account (optional, for caching - get one at [upstash.com](https://upstash.com))

---

## Local Development

### Step 1: Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd /ai-chatbot

# Install dependencies
npm install
```

### Step 2: Set Up Database

See [Database Setup](#database-setup) section below for detailed instructions.

Quick version:

```bash
# Configure DATABASE_URL in .env
# Then run migrations
npm run db:generate
npm run db:migrate

```

### Step 3: Configure Environment Variables

See [Environment Configuration](#environment-configuration) section below.

Minimum required:

```bash
# Copy example file
cp env.example .env

# Edit .env and add:
# - DATABASE_URL (from your PostgreSQL provider)
# - OPENAI_API_KEY (from OpenAI)
```

### Step 4: Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Step 5: Verify Installation

1. Open `http://localhost:3000` in your browser
2. Send a message in the chat interface
3. Verify you receive an AI response

---

## Database Setup

### Option 1: Local PostgreSQL

1. **Install PostgreSQL** (if not already installed):

   - macOS: `brew install postgresql@14`
   - Ubuntu: `sudo apt-get install postgresql`
   - Windows: Download from [postgresql.org](https://www.postgresql.org/download/windows/)

2. **Create database**:

   ```bash
   createdb chatbot_db
   ```

3. **Update `.env`**:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/chatbot_db"
   ```

### Option 2: NeonDB (Cloud PostgreSQL - Recommended)

1. **Sign up** at [neon.tech](https://neon.tech) (free tier available)

2. **Create a new project**:

   - Choose a project name
   - Select region closest to you
   - Choose latest PostgreSQL version

3. **Get connection string**:

   - Copy the connection string from NeonDB dashboard
   - Format: `postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`

4. **Update `.env`**:
   ```env
   DATABASE_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"
   ```

### Run Migrations

```bash
# Generate Prisma Client (must run first)
npm run db:generate

# Create and apply database schema
npm run db:migrate
# When prompted, name the migration (e.g., "initial_schema")

# Optional: Open Prisma Studio to view database
npm run db:studio
```

### Database Schema

The schema includes two main tables:

- **`conversations`**: Stores conversation sessions

  - `id` (CUID)
  - `createdAt`, `updatedAt` (timestamps)
  - `metadata` (JSON field for additional data)

- **`messages`**: Stores individual messages
  - `id` (CUID)
  - `conversationId` (foreign key)
  - `sender` (enum: "USER" | "AI")
  - `text` (message content)
  - `timestamp`

### No Seed Data Required

The application doesn't require seed data - conversations and messages are created dynamically as users interact with the chatbot.

---

## Environment Configuration

### Required Variables

Create a `.env` file in the `ai-chatbot/` directory (use `env.example` as template):

```env
# Database (REQUIRED)
DATABASE_URL="postgresql://user:password@host:port/database"

# OpenAI API (REQUIRED)
OPENAI_API_KEY="sk-your-openai-api-key-here"
```

### Optional Variables

```env
# Upstash Redis (Optional - for caching)
UPSTASH_REDIS_REST_URL="https://your-redis-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"

# LLM Configuration (Optional)
LLM_MODEL="gpt-3.5-turbo"      # or "gpt-4", "gpt-4-turbo-preview"
MAX_TOKENS="500"                # Max tokens per response (cost control)
LLM_TIMEOUT="30000"             # Timeout in milliseconds (30 seconds)

# Node Environment (Optional)
NODE_ENV="development"
```

### Getting API Keys

#### OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Navigate to **API Keys** section
4. Click **"Create new secret key"**
5. Copy the key and add to `.env`

**Note**: OpenAI charges per token usage. `gpt-3.5-turbo` is cheaper, `gpt-4` is more capable but expensive.

#### Upstash Redis (Optional - Recommended for Production)

1. Sign up at [upstash.com](https://upstash.com) (free tier: 10K commands/day)
2. Create a Redis database (Regional, Allkeys LRU)
3. Copy REST API credentials from dashboard
4. Add to `.env`:
   ```env
   UPSTASH_REDIS_REST_URL="https://your-url.upstash.io"
   UPSTASH_REDIS_REST_TOKEN="your-token"
   ```

See `QUICK_START_REDIS.md` for detailed Redis setup instructions.

## Architecture Overview

### Project Structure

```
ai-chatbot/
├── app/
│   ├── api/                    # API Routes (Next.js App Router)
│   │   ├── chat/
│   │   │   └── message/        # Main chat API (GET/POST)
│   │   └── channels/           # Channel webhooks (WhatsApp, Instagram)
│   ├── page.tsx                # Frontend chat UI (React)
│   └── layout.tsx              # Root layout
│
├── lib/
│   ├── channels/               # Channel Integration Layer
│   │   ├── base.ts             # Base adapter class
│   │   ├── adapters/           # Channel implementations
│   │   │   ├── web.ts
│   │   │   ├── whatsapp.ts
│   │   │   └── instagram.ts
│   │   └── types.ts            # Channel type definitions
│   │
│   ├── tools/                  # Tool Integration Layer
│   │   ├── base.ts             # Base tool class
│   │   ├── inventory-check.ts
│   │   ├── order-lookup.ts
│   │   ├── shipping-tracker.ts
│   │   └── types.ts            # Tool type definitions
│   │
│   ├── services/               # Business Logic Layer
│   │   └── chat-service.ts     # Unified chat processing (future)
│   │
│   ├── db.ts                   # Prisma client instance
│   ├── llm.ts                  # LLM service (OpenAI integration)
│   ├── redis.ts                # Redis caching layer
│   └── types.ts                # Shared type definitions
│
├── prisma/
│   └── schema.prisma           # Database schema
│
└── components/                 # React components (shadcn/ui)
```

## LLM Implementation

### Provider: OpenAI

**Model**: GPT-3.5-turbo (default, configurable to GPT-4)

**Why OpenAI?**

- Most mature API with excellent documentation
- Fast response times
- Good balance of cost and capability for customer support use case
- Easy to switch models via environment variable

### Prompting Strategy

#### System Prompt

The system prompt includes:

1. **Role Definition**: "You are a helpful support agent for TechMart E-Commerce"
2. **Store Knowledge**: Embedded policies (shipping, returns, support hours, etc.)
3. **Guidelines**:
   - Be friendly and professional
   - Provide accurate information
   - Keep responses concise but helpful
   - Direct to support if unsure

#### Context Management

- **History Limit**: Last 10 messages (configurable)
- **Purpose**: Cost control and token limit management
- **Trade-off**: Older context may be lost, but sufficient for customer support conversations

### Error Handling

The LLM service handles various error scenarios:

1. **Rate Limits (429)**: User-friendly message with support contact
2. **Authentication Errors (401/403)**: Generic unavailable message
3. **Server Errors (500+)**: Service temporarily unavailable message
4. **Timeouts**: Abort controller with 30s default timeout
5. **Network Errors**: Graceful fallback with helpful message

All errors include support contact information for persistent issues.

---

## Trade-offs & Future Improvements

### Trade-offs

#### 1. **Limited Conversation Context**

- **Current**: Last 10 messages only
- **Trade-off**: Older context lost, but keeps costs low
- **Rationale**: Most customer support queries resolve within 10 message exchanges

#### 2. **Single LLM Provider**

- **Current**: OpenAI only (no fallback)
- **Trade-off**: Dependency on OpenAI availability
- **Rationale**: Simplicity, most reliable provider

#### 3. **No Fine-tuning**

- **Current**: System prompt-based guidance
- **Trade-off**: Less personalized than fine-tuned models
- **Rationale**: Faster iteration, no training data required

#### 4. **Caching Strategy**

- **Current**: Cache invalidation on every new message
- **Trade-off**: More cache misses immediately after messages
- **Rationale**: Ensures data freshness, simple implementation

#### 5. **No Authentication**

- **Current**: Session-based, no user authentication
- **Trade-off**: Cannot track users across devices
- **Rationale**: Focus on core functionality first

### If I Had More Time...

#### High Priority

1. **Multi-Provider LLM Support**

   - Fallback to Anthropic Claude if OpenAI fails
   - Provider abstraction layer
   - Cost comparison and optimization

2. **Complete Tool Integration**

   - Implement tool calling with OpenAI function calling
   - Connect real APIs (order management, shipping, inventory)
   - Tool result formatting in responses

3. **Channel Implementation**

   - Complete WhatsApp adapter with Business API
   - Complete Instagram adapter with Graph API
   - Webhook signature validation

4. **Refactor to ChatService**

   - Move chat logic from API routes to `ChatService`
   - Channel-agnostic message processing
   - Unified error handling

5. **Enhanced Caching**
   - Cache warming for active conversations
   - Selective caching (active sessions only)
   - Cache hit rate monitoring

#### Medium Priority

6. **User Authentication**

   - OAuth integration (Google, GitHub)
   - User profiles and preferences
   - Conversation history per user

7. **Analytics & Monitoring**

   - Conversation analytics dashboard
   - LLM performance metrics
   - Cost tracking per conversation

8. **Rate Limiting**

   - Per-user rate limits
   - Redis-based rate limiting
   - Abuse prevention

9. **Message Search**

   - Full-text search in conversations
   - Search by keywords or topics
   - Export conversation history

10. **Testing**
    - Unit tests for services
    - Integration tests for API routes
    - E2E tests for chat flow

#### Nice to Have

11. **Advanced Features**

    - Conversation summaries
    - Sentiment analysis
    - Multi-language support
    - Voice input/output

12. **Admin Dashboard**

    - Conversation management
    - System configuration UI
    - Analytics visualization

13. **Deployment Optimization**

    - Docker containerization
    - Kubernetes deployment configs
    - CI/CD pipelines

14. **Documentation**
    - API documentation (OpenAPI/Swagger)
    - Architecture diagrams
    - Deployment guides

---

### External Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [Upstash Redis Docs](https://docs.upstash.com/redis)

---

## License

[Your License Here]

---

## Contributing

[Contributing Guidelines Here]

---

**Built with ❤️ using Next.js, Prisma, and OpenAI**
