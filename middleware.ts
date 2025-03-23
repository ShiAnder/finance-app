import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function middleware(request: NextRequest) {
  // Only run middleware for API routes that need protection
  if (!request.nextUrl.pathname.startsWith('/api/transactions')) {
    return NextResponse.next();
  }

  // Check for auth token
  const token = request.cookies.get('auth-token')?.value;

  // If no token and trying to access protected route, redirect to login
  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    // Verify token
    const { payload } = await jwtVerify(token, JWT_SECRET);
    console.log('Decoded token:', payload); // Log the decoded token
    
    // Add user info to headers for route handlers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', String(payload.id));
    requestHeaders.set('x-user-role', String(payload.role));
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }
}