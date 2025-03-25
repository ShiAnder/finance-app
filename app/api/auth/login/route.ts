import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma'; // Adjust this import based on your project structure
import bcrypt from 'bcrypt';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });
    
    // Check if user exists and password is correct
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    // Generate a JWT token
    const token = await new SignJWT({ id: user.id, name: user.name, email: user.email, role: user.role })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET);
    
    // Set the token in cookies
    const cookieStore = await cookies();
    cookieStore.set('auth-token', token, { httpOnly: true, secure: true, sameSite: 'strict' });
    
    // Return user data (without password)
    const {...userData } = user;
    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}