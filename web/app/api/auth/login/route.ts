import { NextResponse } from 'next/server';
import { loginWithSupabase } from '@/lib/auth/auth-service';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password } = body as { email?: string; password?: string };

    const errors: Record<string, string> = {};

    if (!email || typeof email !== 'string' || !email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please provide a valid email address.';
    }

    if (!password || typeof password !== 'string' || !password.trim()) {
      errors.password = 'Password is required.';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        {
          success: false,
          errors,
          message: 'Please complete all required fields.'
        },
        { status: 400 }
      );
    }

    const result = await loginWithSupabase(email!, password!);

    if (!result.success || !result.user) {
      return NextResponse.json(
        {
          success: false,
          message: result.message || 'Invalid email address or password. Please verify your credentials and try again.'
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: result.user,
      message: 'Authentication successful.'
    });
  } catch (err: unknown) {
    console.error('Login error:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'An unexpected server error occurred during authentication.'
      },
      { status: 500 }
    );
  }
}
