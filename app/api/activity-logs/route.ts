import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Define interfaces for type safety
interface User {
  name: string | null;
}

interface ActivityDetails {
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  description?: string;
}

interface RawActivityLog {
  id: number;
  userId: number;
  userName: string;
  action: string;
  entityType: string;
  entityId: number;
  details: string;
  createdAt: Date;
  user?: User | null;
}

interface TransformedActivityLog {
  id: number;
  userId: number;
  userName: string;
  action: string;
  createdAt: string;
  entityType: string;
  entityId: number;
  description?: string;
  details?: ActivityDetails;
}

export async function GET(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch activity logs based on user role
    const activityLogs: RawActivityLog[] = await prisma.activityLog.findMany({
      where: userRole === 'OWNER' ? {} : { userId: parseInt(userId) },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    // Transform logs and parse details
    const transformedLogs: TransformedActivityLog[] = activityLogs.map(
      (log: RawActivityLog) => {
        let parsedDetails: ActivityDetails | undefined;
        let description: string | undefined;

        try {
          // Try to parse details as JSON
          const details = JSON.parse(log.details) as Partial<ActivityDetails>;

          // Check if details have before/after structure
          if (details.before && details.after) {
            parsedDetails = {
              before: details.before as Record<string, unknown>,
              after: details.after as Record<string, unknown>,
              description: details.description,
            };
          } else {
            // Fallback to description if doesn't match expected structure
            description = log.details;
          }
        } catch {
          // If details is not JSON or parsing fails, treat it as a description
          description = log.details;
        }

        return {
          id: log.id,
          userId: log.userId,
          userName: log.user?.name || log.userName,
          action: log.action,
          createdAt: log.createdAt.toISOString(),
          entityType: log.entityType,
          entityId: log.entityId,
          description,
          details: parsedDetails,
        };
      }
    );

    return NextResponse.json(transformedLogs);
  } catch (err) {
    console.error('Activity logs API error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch activity logs' },
      { status: 500 }
    );
  }
}