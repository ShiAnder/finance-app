import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function GET() {
  try {
    // Get the auth token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    console.log('Auth token:', token); // Log the token

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    try {
      // Verify the JWT token
      const { payload } = await jwtVerify(token, JWT_SECRET);
      console.log('Decoded token:', payload); // Log the decoded token

      // Return user data from the token
      return NextResponse.json({
        user: {
          id: payload.id,
          name: payload.name,
          email: payload.email,
          role: payload.role
        }
      });
    } catch (error) {
      // Invalid token
      console.error('Token verification error:', error);
      return NextResponse.json({ user: null }, { status: 401 });
    }
  } catch (error) {
    console.error('Session API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}