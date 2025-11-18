import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AssetMovement } from '@/lib/db/models';
import { createPermissionError, createValidationError, formatErrorResponse } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';

// POST /api/fa/asset-movements/:id/approve
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    if (!hasPermission(user, 'fa.movements.approve')) {
      throw createPermissionError('Insufficient permissions to approve asset movements');
    }

    const movement = await AssetMovement.findOne({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!movement) {
      throw createValidationError('Movement not found', 'movementId');
    }

    if (movement.status !== 'draft') {
      throw createValidationError(
        'Only draft movements can be approved',
        'status'
      );
    }

    await movement.update({
      status: 'approved',
      approvedBy: user.id,
      approvedAt: new Date(),
    });

    logger.info('Asset movement approved', {
      movementId: movement.id,
      movementNumber: movement.movementNumber,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Movement approved successfully. You can now complete the movement.',
      movement,
    });
  } catch (error) {
    logger.error('Error approving asset movement', { movementId: params.id, error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
