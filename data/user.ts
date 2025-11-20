import { db } from "@/lib/db";

// Simple in-memory cache to reduce database calls
const userCache = new Map<string, { user: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getUserByEmail = async (email: string) => {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Looking up user with email: ${email}`);
    }
    const user = await db.user.findUnique({ 
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        isTwoFactorEnabled: true,
        emailVerified: true,
        image: true,
        totpEnabled: true,
        totpVerified: true,
        totpSecret: true,
        recoveryCodes: true
      }
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(`User lookup result: ${user ? 'Found' : 'Not found'}`);
      
      // Debug password field if user exists
      if (user) {
        console.log(`Password field exists: ${!!user.password}`);
        console.log(`Password length: ${user.password ? user.password.length : 0}`);
        
        // Check for potential corruption in the password hash
        if (user.password && (
            user.password.length < 50 || // bcrypt hashes are typically 60 chars
            !user.password.startsWith('$2') // bcrypt hashes start with $2a$ or similar
        )) {
          console.warn("Warning: Password hash may be corrupted");
        }
      }
    }

    return user;
  } catch (error: any) {
    console.error("Error in getUserByEmail:", error);
    return null;
  }
};

export const getUserById = async (id: string) => {
  try {
    // Check cache first
    const cached = userCache.get(id);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.user;
    }

    // Only log in development to reduce noise
    if (process.env.NODE_ENV === 'development') {
      console.log(`Looking up user with id: ${id}`);
    }

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        isTwoFactorEnabled: true,
        totpEnabled: true,
        totpVerified: true,
        createdAt: true  // Required for MFA enforcement calculations
      }
    });

    // Cache the result
    if (user) {
      userCache.set(id, { user, timestamp: Date.now() });
    } else {
      // Log missing user info for debugging
      if (process.env.NODE_ENV === 'development') {
        console.warn(`⚠️  User not found in database: ${id}`);
        console.warn('This might indicate a stale session. Try clearing browser cookies or logging out/in.');
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`User id lookup result: ${user ? 'Found' : 'Not found'}`);
    }

    return user;
  } catch (error: any) {
    console.error("Error in getUserById:", error);
    return null;
  }
};

/**
 * Get admin user by ID with all necessary fields for admin authentication
 * This is separate from getUserById to maintain clear separation between
 * admin and regular user data access patterns
 */
export const getAdminById = async (id: string) => {
  try {
    // Only log in development to reduce noise
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ADMIN] Looking up admin account with id: ${id}`);
    }

    const admin = await db.adminAccount.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        image: true,
        isTwoFactorEnabled: true,
        totpEnabled: true,
        totpVerified: true,
        createdAt: true,           // Required for MFA enforcement calculations
        totpSecret: true,           // For 2FA verification
        recoveryCodes: true         // For account recovery
      }
    });

    // No role verification needed - AdminAccount table only contains admins (ADMIN or SUPERADMIN)

    if (process.env.NODE_ENV === 'development') {
      console.log(`[ADMIN] Admin lookup result: ${admin ? 'Found' : 'Not found'}`);
      if (admin) {
        console.log(`[ADMIN] Admin details:`, {
          id: admin.id,
          email: admin.email,
          role: admin.role,
          emailVerified: !!admin.emailVerified,
          isTwoFactorEnabled: admin.isTwoFactorEnabled,
          totpEnabled: admin.totpEnabled,
          totpVerified: admin.totpVerified,
          hasCreatedAt: !!admin.createdAt
        });
      }
    }

    return admin;
  } catch (error: any) {
    console.error("[ADMIN] Error in getAdminById:", error);
    return null;
  }
};

// Clean up cache periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of userCache.entries()) {
      if (now - value.timestamp > CACHE_DURATION) {
        userCache.delete(key);
      }
    }
  }, CACHE_DURATION);
}