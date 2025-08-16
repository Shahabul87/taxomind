// ML Predictions API - Simplified
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ success: true, predictions: [] });
}

export async function POST() {
  return NextResponse.json({ success: true, message: 'Prediction generated' });
}