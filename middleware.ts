import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

// Define route access by role
const routePermissions = {
  '/api/transactions': ['ADMIN', 'OWNER'],
  '/api/users': ['ADMIN', 'OWNER'],
  '/api/activity-logs': ['ADMIN', 'OWNER']
  // Add other routes as needed
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if this is a protected API route
  const isProtectedRoute = Object.keys(routePermissions).some(route => 
    pathname.startsWith(route)
  );
  
  // If not a protected route, skip middleware
  if (!isProtectedRoute) {
    return NextResponse.next();
  }
  
  // Check for auth token
  const token = request.cookies.get('auth-token')?.value;
  
  // If no token and trying to access protected route, return 401
  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  try {
    // Verify token
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userRole = String(payload.role);
    
    // Add user info to headers for route handlers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', String(payload.id));
    requestHeaders.set('x-user-role', userRole);
    
    // Check role-based permissions for the route
    for (const [route, allowedRoles] of Object.entries(routePermissions)) {
      if (pathname.startsWith(route) && !allowedRoles.includes(userRole)) {
        return NextResponse.json(
          { error: 'Forbidden: Insufficient permissions' },
          { status: 403 }
        );
      }
    }
    
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

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    '/api/:path*'  // Run on all API routes
  ],
};