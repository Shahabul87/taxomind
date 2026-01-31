import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { z } from 'zod';
import { devOnlyGuard } from '@/lib/api/dev-only-guard';

// Comprehensive API test endpoint with multiple test scenarios
export async function GET(req: NextRequest) {
  const blocked = devOnlyGuard();
  if (blocked) return blocked;

  const searchParams = req.nextUrl.searchParams;
  const testType = searchParams.get('type') || 'basic';
  
  const tests: Record<string, any> = {
    basic: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
    },
    headers: {
      headers: Object.fromEntries(req.headers.entries()),
      cookies: req.cookies.getAll(),
      url: req.url,
      method: req.method,
    },
    query: {
      allParams: Object.fromEntries(searchParams.entries()),
      count: searchParams.toString().split('&').length,
      parsed: {
        page: searchParams.get('page'),
        limit: searchParams.get('limit'),
        sort: searchParams.get('sort'),
        filter: searchParams.get('filter'),
      },
    },
    response_codes: {
      message: 'Use ?code=XXX to test specific response codes',
      available: [200, 201, 400, 401, 403, 404, 500, 502, 503],
    },
  };

  // Handle specific response code testing
  const code = searchParams.get('code');
  if (code) {
    const statusCode = parseInt(code);
    return NextResponse.json(
      { 
        message: `Testing response code ${statusCode}`,
        timestamp: new Date().toISOString(),
      },
      { status: statusCode }
    );
  }

  // Handle specific test type
  if (testType in tests) {
    return NextResponse.json({
      success: true,
      testType,
      data: tests[testType],
    });
  }

  // Return all available tests
  return NextResponse.json({
    success: true,
    availableTests: Object.keys(tests),
    usage: 'Add ?type=<testType> to run specific test',
    examples: [
      '/api/test/comprehensive?type=basic',
      '/api/test/comprehensive?type=headers',
      '/api/test/comprehensive?type=query&page=1&limit=10',
      '/api/test/comprehensive?code=404',
    ],
  });
}

// POST endpoint for testing request body handling
export async function POST(req: NextRequest) {
  const blocked = devOnlyGuard();
  if (blocked) return blocked;

  try {
    const body = await req.json();
    
    // Validate request body
    const schema = z.object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      data: z.any().optional(),
    });
    
    const validatedData = schema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
          details: validatedData.error.flatten(),
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'POST request processed successfully',
      received: validatedData.data,
      timestamp: new Date().toISOString(),
      headers: {
        contentType: req.headers.get('content-type'),
        contentLength: req.headers.get('content-length'),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT endpoint for testing updates
export async function PUT(req: NextRequest) {
  const blocked = devOnlyGuard();
  if (blocked) return blocked;

  try {
    const body = await req.json();
    
    return NextResponse.json({
      success: true,
      message: 'PUT request processed successfully',
      operation: 'update',
      data: body,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process PUT request',
      },
      { status: 500 }
    );
  }
}

// DELETE endpoint for testing deletions
export async function DELETE(req: NextRequest) {
  const blocked = devOnlyGuard();
  if (blocked) return blocked;

  const searchParams = req.nextUrl.searchParams;
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json(
      {
        success: false,
        error: 'ID parameter required for DELETE operation',
      },
      { status: 400 }
    );
  }
  
  return NextResponse.json({
    success: true,
    message: 'DELETE request processed successfully',
    deletedId: id,
    timestamp: new Date().toISOString(),
  });
}

// PATCH endpoint for testing partial updates
export async function PATCH(req: NextRequest) {
  const blocked = devOnlyGuard();
  if (blocked) return blocked;

  try {
    const body = await req.json();
    
    return NextResponse.json({
      success: true,
      message: 'PATCH request processed successfully',
      operation: 'partial_update',
      changes: body,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process PATCH request',
      },
      { status: 500 }
    );
  }
}