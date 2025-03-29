import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parse } from 'json2csv';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const type = searchParams.get('type');
        const filterUserId = searchParams.get('userId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        
        const userId = request.headers.get('x-user-id');
        const userRole = request.headers.get('x-user-role');

        if (!userId) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const parsedUserId = parseInt(userId, 10);

        // Define an interface for where condition to avoid 'any'
        interface WhereCondition {
            userId?: number;
            category?: string;
            type?: string;
            date?: {
                gte?: Date;
                lte?: Date;
            };
        }

        const whereCondition: WhereCondition = {};

        // Apply user filter based on role
        if (userRole === 'OWNER') {
            // If owner and userId filter specified, filter by that userId
            if (filterUserId && filterUserId !== 'all') {
                whereCondition.userId = parseInt(filterUserId, 10);
            }
        } else {
            // Non-owners only see their own transactions
            whereCondition.userId = parsedUserId;
        }

        // Apply category filter
        if (category && category !== 'all') {
            whereCondition.category = category;
        }
        
        // Apply type filter
        if (type && type !== 'all') {
            whereCondition.type = type;
        }

        // Apply date range filter
        if (startDate || endDate) {
            whereCondition.date = {};
            if (startDate) whereCondition.date.gte = new Date(startDate);
            if (endDate) {
                // Set the end date to the end of the day
                const endOfDay = new Date(endDate);
                endOfDay.setHours(23, 59, 59, 999);
                whereCondition.date.lte = endOfDay;
            }
        }

        // Define interfaces for better type safety
        interface User {
            name?: string;
            email?: string;
        }
        
        interface Transaction {
            id: number;
            userId: number;
            user?: User;
            amount: number;
            type: string;
            category: string;
            description: string;
            date: Date;
        }
        
        interface FormattedTransaction {
            id: number;
            date: string;
            user: string;
            userEmail: string;
            type: string;
            category: string;
            description: string;
            amount: string;
        }

        const transactions: Transaction[] = await prisma.transaction.findMany({
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
        });

        if (!transactions.length) {
            return NextResponse.json({ error: 'No transactions found' }, { status: 404 });
        }

        // Format transactions for CSV export
        const formattedTransactions: FormattedTransaction[] = transactions.map(transaction => ({
            id: transaction.id,
            date: transaction.date.toISOString().split('T')[0],
            user: transaction.user?.name || 'Unknown',
            userEmail: transaction.user?.email || 'Unknown',
            type: transaction.type,
            category: transaction.category,
            description: transaction.description,
            amount: transaction.amount.toFixed(2)
        }));

        const csv = parse(formattedTransactions, {
            fields: ['id', 'date', 'user', 'userEmail', 'type', 'category', 'description', 'amount']
        });

        const filename = `transactions_${new Date().toISOString().split('T')[0]}`;
        
        return new Response(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="${filename}.csv"`
            }
        });
    } catch (err) {
        console.error('Export transactions error:', err);
        return NextResponse.json({ error: 'Failed to export transactions' }, { status: 500 });
    }
}