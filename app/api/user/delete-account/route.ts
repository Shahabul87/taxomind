import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import * as bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get confirmation from request body
    const { confirmEmail, confirmPassword } = await req.json();

    if (confirmEmail !== user.email) {
      return NextResponse.json({ error: 'Email confirmation does not match' }, { status: 400 });
    }

    // Verify password if credentials user
    if (confirmPassword) {
      const existingUser = await db.user.findUnique({
        where: { id: user.id },
      });

      if (!existingUser?.password) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      const passwordValid = await bcrypt.compare(confirmPassword, existingUser.password);

      if (!passwordValid) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
      }
    }

    const timestamp = Date.now();

    // GDPR-compliant deletion: Remove personal data, keep anonymized records
    await db.$transaction([
      // Delete sessions
      db.authSession.deleteMany({ where: { userId: user.id } }),

      // Delete OAuth accounts
      db.account.deleteMany({ where: { userId: user.id } }),

      // Delete verification tokens
      db.verificationToken.deleteMany({ where: { email: user.email || '' } }),

      // Anonymize user record (keep for referential integrity)
      db.user.update({
        where: { id: user.id },
        data: {
          name: '[Deleted User]',
          email: `deleted_${user.id}_${timestamp}@example.com`,
          password: null,
          image: null,
          emailVerified: null,
          phone: null,
          // Keep role and timestamps for audit purposes
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully. You will be logged out shortly.'
    });
  } catch (error) {
    console.error('[Account Deletion] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
