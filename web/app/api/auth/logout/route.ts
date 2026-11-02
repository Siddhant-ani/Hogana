import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth/auth-service';

export async function POST() {
  try {
    await clearSessionCookie();
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully. Server session has been invalidated.'
    });
  } catch (err: unknown) {
    console.error('Logout error:', err);
    return NextResponse.json(
      { success: false, message: 'Server error during logout.' },
      { status: 500 }
    );
  }
}
