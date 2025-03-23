// File: app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
     // Get the cookie store
     const cookieStore = await cookies(); // Use await to resolve the promise
    
     // Clear the auth token cookie
     cookieStore.delete('auth-token');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}