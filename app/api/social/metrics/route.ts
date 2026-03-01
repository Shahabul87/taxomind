import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {

    // Get current user
    const session = await auth();
    
    if (!session?.user?.id) {

      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if user has connected accounts
    const facebookAccount = await db.account.findFirst({
      where: {
        userId: session.user.id,
        provider: 'facebook'
      }
    });
    
    if (!facebookAccount) {

      return NextResponse.json({ 
        error: "No connected Facebook account found",
        shouldConnect: true 
      }, { status: 404 });
    }

    try {
      // Forward the request to the appropriate endpoint
      // Fetch data from Facebook metrics API internally
      // Get the base URL from the request
      const origin = req.headers.get('host') || 'localhost:3000';
      const protocol = origin.includes('localhost') ? 'http' : 'https';
      const baseUrl = `${protocol}://${origin}`;
      
      // Construct the absolute URL
      const facebookMetricsUrl = `${baseUrl}/api/social/facebook/metrics`;
      
      // Make the request
      const response = await fetch(facebookMetricsUrl, {
        signal: AbortSignal.timeout(10_000),
      });
      
      if (!response.ok) {

        const errorText = await response.text();

        return NextResponse.json({ 
          error: `Failed to fetch Facebook metrics (${response.status})`,
          details: errorText
        }, { status: response.status });
      }
      
      // Return the response
      const data = await response.json();

      return NextResponse.json(data);
    } catch (fetchError) {
      logger.error("Error fetching from Facebook metrics API:", fetchError);
      return NextResponse.json({ 
        error: "Error communicating with Facebook API service",
        details: fetchError instanceof Error ? fetchError.message : String(fetchError)
      }, { status: 500 });
    }
  } catch (error) {
    logger.error("API error in social metrics route:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
} 