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
    
    // If admin, get all transactions with user details
    if (userRole === 'ADMIN') {
      const transactions = await prisma.transaction.findMany({
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          date: 'desc'
        }
      });
      
      return NextResponse.json(transactions);
    } 
    
    // Regular user - get only their transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: parseInt(userId)
      },
      orderBy: {
        date: 'desc'
      }
    });
    
    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    const transaction = await prisma.transaction.create({
      data: {
        amount: body.amount,
        type: body.type,
        category: body.category,
        description: body.description,
        userId: parseInt(userId),
        date: new Date()
      }
    });
    
    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Create transaction error:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}