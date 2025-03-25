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

export async function DELETE(request: Request) {
  try {
    const userRole = request.headers.get('x-user-role');
    
    // Only allow OWNER role to delete users
    if (userRole !== 'OWNER') {
      return NextResponse.json(
        { error: 'Unauthorized. Only owners can delete users' },
        { status: 403 }
      );
    }
    
    // Extract user ID from the URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const userId = pathSegments[pathSegments.length - 1];
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Delete associated transactions first to prevent foreign key constraints
    await prisma.transaction.deleteMany({
      where: {
        userId: parseInt(userId)
      }
    });
    
    // Delete user
    const deletedUser = await prisma.user.delete({
      where: {
        id: parseInt(userId)
      }
    });
    
    return NextResponse.json(deletedUser);
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}