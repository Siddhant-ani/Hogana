import { NextResponse } from 'next/server';
import { getCurrentSessionUser } from '@/lib/auth/auth-service';

export async function GET() {
  try {
    const user = await getCurrentSessionUser();
    if (!user) {
      return NextResponse.json({
        authenticated: false,
        user: null
      });
    }

    return NextResponse.json({
      authenticated: true,
      user
    });
  } catch (err: unknown) {
    console.error('Session inspection error:', err);
    return NextResponse.json({
      authenticated: false,
      user: null
    });
  }
}
