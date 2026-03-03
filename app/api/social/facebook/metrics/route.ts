import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { facebookClient, transformFacebookData, formatFacebookError } from '@/lib/facebook';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    // Get the current user session
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    
    // Get the user's Facebook account from the database
    const facebookAccount = await db.account.findFirst({
      where: {
        userId: session.user.id,
        provider: 'facebook'
      }
    });
    
    if (!facebookAccount || !facebookAccount.access_token) {
      return NextResponse.json({ error: 'No connected Facebook account found' }, { status: 404 });
    }
    
    // Check if token is expired and handle refresh if needed
    const now = Math.floor(Date.now() / 1000);
    if (facebookAccount.expires_at && facebookAccount.expires_at < now) {
      return NextResponse.json(
        { error: 'Facebook access token has expired. Please reconnect your account.' }, 
        { status: 401 }
      );
    }
    
    // Get access token
    const accessToken = facebookAccount.access_token;
    
    try {
      // First get user's Facebook pages
      const pages = await facebookClient.getUserPages(accessToken);
      
      // If user has no pages, return empty data
      if (!pages || pages.length === 0) {
        return NextResponse.json(
          { 
            message: 'No Facebook pages found. You need a Facebook page to view insights.',
            data: null 
          }, 
          { status: 200 }
        );
      }
      
      // Get data for the first page
      const page = pages[0];
      const pageId = page.id;
      const pageAccessToken = page.access_token;
      
      // Fetch all required data
      const [pageData, insightsData, postsData] = await Promise.all([
        facebookClient.getPageFollowers(pageId, pageAccessToken),
        facebookClient.getPageInsights(pageId, pageAccessToken),
        facebookClient.getPagePosts(pageId, pageAccessToken)
      ]);
      
      // Transform data to our format
      const formattedData = transformFacebookData(pageData, insightsData, postsData);
      
      return NextResponse.json({ data: formattedData }, { status: 200 });
    } catch (apiError: unknown) {
      // Handle specific Facebook API errors
      const errorMessage = formatFacebookError(apiError);
      logger.error('Facebook API error:', errorMessage);
      const statusCode = apiError instanceof Error && 'response' in apiError
        ? ((apiError as Record<string, unknown>).response as Record<string, unknown>)?.status as number || 500
        : 500;

      return NextResponse.json(
        { error: errorMessage },
        { status: statusCode }
      );
    }
  } catch (error) {
    logger.error('Error fetching Facebook metrics:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve metrics from Facebook' }, 
      { status: 500 }
    );
  }
} 