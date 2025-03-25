import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Adjust based on your project structure|


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
    if (userRole === 'OWNER') {
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

// POST method for creating transactions
export async function POST(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse the request body
    const data = await request.json();

    // Validate the request data
    if (!data.amount || !data.description || !data.type || !data.category) {
      return NextResponse.json(
        { error: 'Amount, description, type, and category are required' },
        { status: 400 }
      );
    }

    // Validate transaction type
    const validTypes = ['INCOME', 'EXPENSE', 'OTHER'];
    if (!validTypes.includes(data.type)) {
      return NextResponse.json(
        { error: 'Type must be one of: INCOME, EXPENSE, OTHER' },
        { status: 400 }
      );
    }

    // Create the transaction
    const transaction = await prisma.transaction.create({
      data: {
        amount: parseFloat(data.amount),
        type: data.type,
        category: data.category,
        description: data.description,
        date: data.date ? new Date(data.date) : new Date(),
        userId: parseInt(userId),
      }
    });

    
    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Create transaction error:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}