import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthUser {
  id: number;
  email: string;
  role: string;
}

export async function getAuthUser(req?: NextRequest): Promise<AuthUser | null> {
  try {
    // Get token from cookie
    const cookieStore = await cookies();
    const token = req 
      ? req.cookies.get('auth-token')?.value 
      : cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return null;
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === 'ADMIN';
}

export function isAuthenticated(user: AuthUser | null): boolean {
  return user !== null;
}