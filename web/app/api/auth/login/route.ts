import { NextResponse } from 'next/server';
import { authenticateCredentials, createSessionToken, setSessionCookie } from '@/lib/auth/auth-service';

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

    const user = await authenticateCredentials(email!, password!);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email address or password. Please verify your credentials and try again.'
        },
        { status: 401 }
      );
    }

    const token = createSessionToken(user);
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
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
