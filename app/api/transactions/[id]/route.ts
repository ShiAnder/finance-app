import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity } from '@/lib/activityLogger';

export async function PUT(
  request: Request
) {
  try {
    const userId = request.headers.get('x-user-id');
    const userName = request.headers.get('x-user-name') || 'Unknown User';
    const userRole = request.headers.get('x-user-role');

    // Extract transaction ID from the URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!id) {
      return NextResponse.json({ error: 'Invalid transaction ID' }, { status: 400 });
    }

    const transactionId = parseInt(id, 10);
    if (isNaN(transactionId)) {
      return NextResponse.json({ error: 'Invalid transaction ID' }, { status: 400 });
    }

    // Check if the transaction exists
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id: transactionId }
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Regular users can only update their own transactions
    if (userRole !== 'ADMIN' && existingTransaction.userId !== parseInt(userId, 10)) {
      return NextResponse.json(
        { error: 'You are not authorized to update this transaction' },
        { status: 403 }
      );
    }

    const body = await request.json();

    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        amount: body.amount,
        type: body.type,
        category: body.category,
        description: body.description
      }
    });

    // Log update action
    await logActivity(
      parseInt(userId, 10),
      userName,
      'UPDATE',
      'Transaction',
      transactionId,
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
  request: Request
) {
  try {
    const userId = request.headers.get('x-user-id');
    const userName = request.headers.get('x-user-name') || 'Unknown User';
    const userRole = request.headers.get('x-user-role');

    // Extract transaction ID from the URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!id) {
      return NextResponse.json({ error: 'Invalid transaction ID' }, { status: 400 });
    }

    const transactionId = parseInt(id, 10);
    if (isNaN(transactionId)) {
      return NextResponse.json({ error: 'Invalid transaction ID' }, { status: 400 });
    }

    // Check if the transaction exists
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id: transactionId }
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Authorization check
    if (userRole !== 'ADMIN' && existingTransaction.userId !== parseInt(userId, 10)) {
      return NextResponse.json(
        { error: 'You are not authorized to delete this transaction' },
        { status: 403 }
      );
    }

    // Log delete action
    await logActivity(
      parseInt(userId, 10),
      userName,
      'DELETE',
      'Transaction',
      transactionId,
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

    // Delete transaction
    await prisma.transaction.delete({
      where: { id: transactionId }
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