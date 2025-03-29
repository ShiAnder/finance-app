import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


type TransactionFilters = {
  userId?: number;
  category?: string;
  type?: string;
  date?: {
    gte?: Date;
    lte?: Date;
  };
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const filterUserId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const parsedUserId = parseInt(userId, 10);
    const skip = (page - 1) * pageSize;

    const whereCondition: TransactionFilters = {};
    
    if (userRole === 'OWNER') {
      if (filterUserId && filterUserId !== 'all') {
        whereCondition.userId = parseInt(filterUserId, 10);
      }
    } else {
      whereCondition.userId = parsedUserId;
    }

    if (category && category !== 'all') {
      whereCondition.category = category;
    }
    
    if (type && type !== 'all') {
      whereCondition.type = type;
    }

    if (startDate || endDate) {
      whereCondition.date = {};
      if (startDate) whereCondition.date.gte = new Date(startDate);
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        whereCondition.date.lte = endOfDay;
      }
    }

    try {
      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where: whereCondition,
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          },
          orderBy: { date: 'desc' },
          skip,
          take: pageSize
        }),
        prisma.transaction.count({ where: whereCondition })
      ]);
      
      return NextResponse.json({
        transactions,
        pagination: {
          currentPage: page,
          pageSize,
          totalItems: total,
          totalPages: Math.ceil(total / pageSize)
        }
      });
    } catch (dbError) {
      console.error('Database query error:', dbError);
      return NextResponse.json(
        { error: 'Database query failed' },
        { status: 500 }
      );
    }
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