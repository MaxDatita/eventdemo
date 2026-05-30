import { NextRequest, NextResponse } from 'next/server';
import { clearDemoAuthCookies, getSafeNextPath } from '@/lib/demo-auth';

export async function GET(request: NextRequest) {
  const nextPath = getSafeNextPath(request.nextUrl.searchParams.get('next') || '/login');
  const response = NextResponse.redirect(new URL(nextPath, request.url));
  clearDemoAuthCookies(response);
  return response;
}
