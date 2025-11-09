import { db } from "@/lib/db";

// In-memory cache for account lookups (expires after 5 minutes)
const accountCache = new Map<string, { account: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const getAccountByUserId = async (userId: string) => {
  try {
    // Check cache first
    const cached = accountCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.account;
    }

    const account = await db.account.findFirst({
      where: { userId },
      select: {
        id: true,
        userId: true,
        type: true,
        provider: true,
        providerAccountId: true,
        // Don't select sensitive tokens in general queries
      }
    });

    // Cache the result
    if (account) {
      accountCache.set(userId, {
        account,
        timestamp: Date.now()
      });
    }

    // Clean up old cache entries (keep cache size manageable)
    if (accountCache.size > 1000) {
      const now = Date.now();
      for (const [key, value] of accountCache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
          accountCache.delete(key);
        }
      }
    }

    return account;
  } catch {
    return null;
  }
};