import { NextResponse } from 'next/server';
import { logoutSupabase } from '@/lib/auth/auth-service';

export async function POST() {
  try {
    const result = await logoutSupabase();
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('Logout error:', err);
    return NextResponse.json(
      { success: false, message: 'Server error during logout.' },
      { status: 500 }
    );
  }
}
