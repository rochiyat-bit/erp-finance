import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AssetMovement, FixedAsset, AssetCategory, AssetLocation } from '@/lib/db/models';
import { createPermissionError, createValidationError, formatErrorResponse } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';

// GET /api/fa/asset-movements/:id
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    if (!hasPermission(user, 'fa.movements.view')) {
      throw createPermissionError('Insufficient permissions to view asset movements');
    }

    const movement = await AssetMovement.findOne({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
      include: [
        {
          model: FixedAsset,
          as: 'asset',
          include: [
            {
              model: AssetCategory,
              as: 'category',
            },
          ],
        },
        {
          model: AssetLocation,
          as: 'fromLocation',
        },
        {
          model: AssetLocation,
          as: 'toLocation',
        },
      ],
    });

    if (!movement) {
      throw createValidationError('Movement not found', 'movementId');
    }

    return NextResponse.json({
      success: true,
      movement,
    });
  } catch (error) {
    logger.error('Error fetching asset movement', { movementId: params.id, error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
