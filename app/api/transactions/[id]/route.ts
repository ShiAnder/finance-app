import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Adjust based on your project structure
import { logActivity } from '@/lib/activityLogger';

export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const userName = request.headers.get('x-user-name') || 'Unknown User';
    const userRole = request.headers.get('x-user-role');

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = context.params;
    const body = await request.json();

    // Check if the transaction exists and belongs to the user
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Regular users can only update their own transactions
    if (userRole !== 'ADMIN' && existingTransaction.userId !== parseInt(userId)) {
      return NextResponse.json(
        { error: 'You are not authorized to update this transaction' },
        { status: 403 }
      );
    }

    const transaction = await prisma.transaction.update({
      where: { id: parseInt(id) },
      data: {
        amount: body.amount,
        type: body.type,
        category: body.category,
        description: body.description
      }
    });

    // Log the edit activity
    await logActivity(
      parseInt(userId),
      userName,
      'UPDATE',
      'Transaction',
      transaction.id,
      JSON.stringify({
        before: {
          amount: existingTransaction.amount,
          type: existingTransaction.type,
          category: existingTransaction.category,
          description: existingTransaction.description
        },
        after: {
          amount: transaction.amount,
          type: transaction.type,
          category: transaction.category,
          description: transaction.description
        }
      })
    );

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Update transaction error:', error);
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const userName = request.headers.get('x-user-name') || 'Unknown User';
    const userRole = request.headers.get('x-user-role');

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = context.params;

    // Check if the transaction exists and belongs to the user
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Regular users can only delete their own transactions
    if (userRole !== 'ADMIN' && existingTransaction.userId !== parseInt(userId)) {
      return NextResponse.json(
        { error: 'You are not authorized to delete this transaction' },
        { status: 403 }
      );
    }

    // Log the delete activity BEFORE deletion to capture details
    await logActivity(
      parseInt(userId),
      userName,
      'DELETE',
      'Transaction',
      parseInt(id),
      JSON.stringify({
        deletedTransaction: {
          amount: existingTransaction.amount,
          type: existingTransaction.type,
          category: existingTransaction.category,
          description: existingTransaction.description,
          date: existingTransaction.date
        }
      })
    );

    await prisma.transaction.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete transaction error:', error);
    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    );
  }
}