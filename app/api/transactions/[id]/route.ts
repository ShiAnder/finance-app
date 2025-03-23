import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Adjust based on your project structure

export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
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
    const userRole = request.headers.get('x-user-role');

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await context.params;

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