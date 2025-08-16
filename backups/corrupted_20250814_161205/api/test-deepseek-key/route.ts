import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Get the API key from environment variables
    const apiKey = process.env.DEEPSEEK_API_KEY;
    
    // Check if the API key is set
    const isKeySet = !!apiKey;
    
    // Safely display a portion of the key for verification
    const maskedKey = apiKey 
      ? `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}` 
      : 'Not set';
    
    // Return the status information
    return NextResponse.json({
      isKeySet,
      maskedKey,
      envVars: Object.keys(process.env).filter(key => 
        key.includes('DEEPSEEK') || key.includes('API_KEY')
      )
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      status: 'error'
    }, { status: 500 });
  }
} 