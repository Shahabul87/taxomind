import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Try to manually test the NextAuth route functionality
    let routeTestResult: any = 'UNKNOWN';
    
    try {
      // Import the handlers directly like the route file does
      const { handlers } = await import('@/auth');
      const { GET: authGET, POST: authPOST } = handlers;
      
      routeTestResult = {
        handlersImported: !!handlers,
        getHandlerAvailable: !!authGET,
        postHandlerAvailable: !!authPOST,
        handlersType: typeof handlers,
      };
    } catch (error) {
      routeTestResult = `ERROR: ${error instanceof Error ? error.message : 'Unknown'}`;
    }

    // Test if we can create a mock request to the auth handler
    let mockRequestTest: any = 'UNKNOWN';
    try {
      const { handlers } = await import('@/auth');
      const { GET: authGET } = handlers;
      
      if (authGET) {
        // Create a mock request to test the handler
        const mockRequest = new NextRequest('https://www.bdgenai.com/api/auth/providers', {
          method: 'GET',
        });
        
        // Try to call the handler (this might fail but will give us info)
        const response = await authGET(mockRequest);
        mockRequestTest = {
          handlerCallable: true,
          responseStatus: response?.status || 'NO_STATUS',
          responseType: typeof response,
        };
      } else {
        mockRequestTest = 'GET_HANDLER_MISSING';
      }
    } catch (mockError) {
      mockRequestTest = `MOCK_ERROR: ${mockError instanceof Error ? mockError.message : 'Unknown'}`;
    }

    return NextResponse.json({
      status: 'Auth Route Test',
      timestamp: new Date().toISOString(),
      tests: {
        routeImportTest: routeTestResult,
        mockHandlerTest: mockRequestTest,
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      }
    });

  } catch (error) {
    return NextResponse.json({
      status: 'Auth Route Test Error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
} 