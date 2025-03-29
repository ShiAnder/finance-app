import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Define the categories
const expenseCategories = [
  "Groceries", 
  "Water Bill", 
  "Electricity", 
  "Building Rental", 
  "Furnitures", 
  "Glass and Crock", 
  "Staff Salary", 
  "Staff Service Charge"
];

const incomeCategories = [
  "Restaurant", 
  "Surf Lessons", 
  "Surf Board Rental"
];

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

    // Validate category based on type
    if (data.type === 'INCOME' && !incomeCategories.includes(data.category) && data.category !== 'Other') {
      return NextResponse.json(
        { error: 'Invalid category for income type' },
        { status: 400 }
      );
    }

    if (data.type === 'EXPENSE' && !expenseCategories.includes(data.category) && data.category !== 'Other') {
      return NextResponse.json(
        { error: 'Invalid category for expense type' },
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