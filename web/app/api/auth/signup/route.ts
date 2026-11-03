import { NextResponse } from 'next/server';
import { signUpWithSupabase } from '@/lib/auth/auth-service';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password, name, company, role } = body as {
      email?: string;
      password?: string;
      name?: string;
      company?: string;
      role?: 'administrator' | 'data_manager' | 'dispatcher' | 'analyst';
    };

    const errors: Record<string, string> = {};

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      errors.name = 'Full name is required (minimum 2 characters).';
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please provide a valid work email address.';
    }

    if (!password || typeof password !== 'string' || !password.trim()) {
      errors.password = 'Password is required.';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        {
          success: false,
          errors,
          message: 'Please complete all required fields correctly.'
        },
        { status: 400 }
      );
    }

    const result = await signUpWithSupabase(
      email!.trim(),
      password!,
      name!.trim(),
      company?.trim(),
      role || 'dispatcher'
    );

    if (!result.success || !result.user) {
      return NextResponse.json(
        {
          success: false,
          message: result.message || 'Registration failed. Please try again.'
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user: result.user,
      message: 'Account created successfully.'
    });
  } catch (err: unknown) {
    console.error('Registration error:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'An unexpected server error occurred during registration.'
      },
      { status: 500 }
    );
  }
}
