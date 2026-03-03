import { NextRequest, NextResponse } from "next/server";
import { certificateService } from "@/lib/certificate/service";
import { logger } from '@/lib/logger';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';

export async function POST(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request, 'standard');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { verificationCode } = await request.json();

    if (!verificationCode) {
      return NextResponse.json(
        { error: "Verification code is required" },
        { status: 400 }
      );
    }

    const result = await certificateService.verifyCertificate(verificationCode);

    return NextResponse.json({
      isValid: result.isValid,
      certificate: result.certificate,
      error: result.error
    });

  } catch (error) {
    logger.error("Certificate verification API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request, 'standard');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const url = new URL(request.url);
    const verificationCode = url.searchParams.get('code');

    if (!verificationCode) {
      return NextResponse.json(
        { error: "Verification code is required" },
        { status: 400 }
      );
    }

    const result = await certificateService.verifyCertificate(verificationCode);

    return NextResponse.json({
      isValid: result.isValid,
      certificate: result.certificate,
      error: result.error
    });

  } catch (error) {
    logger.error("Certificate verification API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}