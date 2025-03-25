import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const userRole = request.headers.get('x-user-role');
    
    // Only allow OWNER role to fetch all users
    if (userRole !== 'OWNER') {
      return NextResponse.json(
        { error: 'Unauthorized. Only owners can access user data' },
        { status: 403 }
      );
    }
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
