import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Adjust this import based on your project structure

export async function GET(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch activity logs based on user role
    const activityLogs = await prisma.activityLog.findMany({
      where: userRole === 'OWNER' ? {} : { userId: parseInt(userId) },
    });

    return NextResponse.json(activityLogs);
  } catch (error) {
    console.error('Activity logs API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity logs' },
      { status: 500 }
    );
  }
}