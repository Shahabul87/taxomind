/**
 * Standalone SAM API Server
 *
 * Express HTTP server that exposes SAM capabilities without Next.js.
 * Mounts SAM API routes as Express handlers with CORS, auth, and rate limiting.
 *
 * Usage:
 *   npx ts-node server/sam-api-server.ts
 *   # or
 *   docker-compose -f server/docker-compose.sam.yml up
 *
 * Environment:
 *   DATABASE_URL       - PostgreSQL connection string
 *   SAM_API_PORT       - Server port (default: 4000)
 *   SAM_API_SECRET     - API key for authentication
 *   CORS_ORIGINS       - Comma-separated allowed origins
 */

import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import { z } from 'zod';
import { expressAdapter } from './adapters/express-adapter';

const app = express();
const PORT = parseInt(process.env.SAM_API_PORT ?? '4000', 10);
const API_SECRET = process.env.SAM_API_SECRET ?? '';
const CORS_ORIGINS = (process.env.CORS_ORIGINS ?? 'http://localhost:3000').split(',');

// =============================================================================
// MIDDLEWARE
// =============================================================================

app.use(express.json({ limit: '1mb' }));
app.use(cors({ origin: CORS_ORIGINS, credentials: true }));

// API key authentication
function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!API_SECRET) {
    next();
    return;
  }

  const apiKey = req.headers['x-api-key'] ?? req.headers.authorization?.replace('Bearer ', '');
  if (apiKey !== API_SECRET) {
    res.status(401).json({ error: 'Invalid API key' });
    return;
  }
  next();
}

// Simple rate limiter (in-memory, per-IP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function rateLimitMiddleware(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip ?? 'unknown';
    const now = Date.now();
    const entry = rateLimitMap.get(key);

    if (!entry || now > entry.resetAt) {
      rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (entry.count >= maxRequests) {
      res.status(429).json({ error: 'Too many requests' });
      return;
    }

    entry.count++;
    next();
  };
}

// =============================================================================
// VALIDATION
// =============================================================================

const ChatSchema = z.object({
  message: z.string().min(1).max(10000),
  userId: z.string().min(1),
  courseId: z.string().nullable().optional(),
  conversationId: z.string().nullable().optional(),
});

const GoalSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  courseId: z.string().optional(),
});

// =============================================================================
// ROUTES
// =============================================================================

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'sam-api', timestamp: new Date().toISOString() });
});

// Chat endpoint
app.post(
  '/api/sam/chat',
  authMiddleware,
  rateLimitMiddleware(20, 60000),
  expressAdapter(async (req) => {
    const parsed = ChatSchema.parse(req.body);
    return {
      status: 200,
      body: {
        success: true,
        data: {
          message: `SAM standalone received: "${parsed.message.slice(0, 50)}..."`,
          suggestions: [],
          conversationId: parsed.conversationId ?? `standalone-${Date.now()}`,
        },
        _note: 'Connect to full SAM engine by configuring database and AI adapter',
      },
    };
  })
);

// SSE real-time events
app.get('/api/sam/realtime/events', authMiddleware, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // Send connected event
  const connectEvent = {
    type: 'connected',
    eventId: `evt-${Date.now()}`,
    timestamp: new Date().toISOString(),
    payload: { capabilities: ['sse', 'interventions'] },
  };
  res.write(`data: ${JSON.stringify(connectEvent)}\n\n`);

  // Heartbeat
  const heartbeat = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`);
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
  });
});

// Goals endpoint
app.get('/api/sam/goals', authMiddleware, expressAdapter(async (req) => {
  const userId = req.query.userId as string;
  if (!userId) {
    return { status: 400, body: { error: 'userId query parameter required' } };
  }
  return {
    status: 200,
    body: { success: true, data: { goals: [], userId } },
  };
}));

app.post(
  '/api/sam/goals',
  authMiddleware,
  rateLimitMiddleware(10, 60000),
  expressAdapter(async (req) => {
    const parsed = GoalSchema.parse(req.body);
    return {
      status: 200,
      body: {
        success: true,
        data: {
          id: `goal-${Date.now()}`,
          ...parsed,
          status: 'ACTIVE',
          progress: 0,
          createdAt: new Date().toISOString(),
        },
      },
    };
  })
);

// Conversations endpoint
app.get('/api/sam/conversations', authMiddleware, expressAdapter(async (req) => {
  const userId = req.query.userId as string;
  if (!userId) {
    return { status: 400, body: { error: 'userId query parameter required' } };
  }
  return {
    status: 200,
    body: { success: true, data: { conversations: [], userId } },
  };
}));

// =============================================================================
// START SERVER
// =============================================================================

app.listen(PORT, () => {
  console.log(`[SAM API Server] Running on port ${PORT}`);
  console.log(`[SAM API Server] Health: http://localhost:${PORT}/health`);
  console.log(`[SAM API Server] Auth: ${API_SECRET ? 'API key required' : 'No auth (development)'}`);
});

export default app;
