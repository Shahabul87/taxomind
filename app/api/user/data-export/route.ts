import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Gather all user data
    const userData = await db.user.findUnique({
      where: { id: user.id },
      include: {
        accounts: true,
        authSessions: true,
        Enrollment: true,
        courses: true,
        Post: true,
        Comment: true,
        Article: true,
        Blog: true,
      },
    });

    // Format data for export
    const exportData = {
      profile: {
        id: userData?.id,
        name: userData?.name,
        email: userData?.email,
        createdAt: userData?.createdAt,
        lastLoginAt: userData?.lastLoginAt,
      },
      accounts: userData?.accounts || [],
      enrollments: userData?.Enrollment || [],
      courses: userData?.courses || [],
      posts: userData?.Post || [],
      comments: userData?.Comment || [],
      articles: userData?.Article || [],
      blogs: userData?.Blog || [],
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0',
    };

    // Return as JSON download
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="taxomind-data-export-${user.id}-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error('[Data Export] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
