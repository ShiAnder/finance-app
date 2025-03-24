import prisma from '@/lib/prisma';

/**
 * Logs user activity for auditing purposes
 * @param userId - ID of the user performing the action
 * @param userName - Name of the user performing the action
 * @param action - Type of action (CREATE, UPDATE, DELETE, etc.)
 * @param entityType - Type of entity being modified (Transaction, User, etc.)
 * @param entityId - ID of the entity being modified
 * @param details - JSON string containing relevant details about the operation
 */
export async function logActivity(
  userId: number,
  userName: string,
  action: string,
  entityType: string,
  entityId: number,
  details: string
) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        userName,
        action,
        entityType,
        entityId,
        details,
      },
    });
  } catch (error) {
    console.error('Activity logging error:', error);
    // Not throwing to prevent disrupting the main operation
  }
}