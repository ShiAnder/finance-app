import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Adjust based on your project structure

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

    if (userRole === 'OWNER') {
      // Fetch summary for all users
      const totalUsers = await prisma.user.count();
      const totalTransactions = await prisma.transaction.count();
      const totalIncome = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: 'INCOME' },
      });
      const totalExpenses = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: 'EXPENSE' },
      });

      return NextResponse.json({
        totalUsers,
        totalTransactions,
        totalIncome: totalIncome._sum.amount || 0,
        totalExpenses: totalExpenses._sum.amount || 0,
      });
    }

    // Fetch summary for a specific user
    const userTransactions = await prisma.transaction.count({
      where: { userId: parseInt(userId) },
    });
    const userIncome = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { userId: parseInt(userId), type: 'INCOME' },
    });
    const userExpenses = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { userId: parseInt(userId), type: 'EXPENSE' },
    });

    return NextResponse.json({
      userTransactions,
      userIncome: userIncome._sum.amount || 0,
      userExpenses: userExpenses._sum.amount || 0,
    });
  } catch (error) {
    console.error('Dashboard summary API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard summary' },
      { status: 500 }
    );
  }
}