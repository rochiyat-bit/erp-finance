import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AssetMovement, FixedAsset } from '@/lib/db/models';
import sequelize from '@/lib/db/sequelize';
import { createPermissionError, createValidationError, formatErrorResponse } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';

// POST /api/fa/asset-movements/:id/complete
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const transaction = await sequelize.transaction();

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    if (!hasPermission(user, 'fa.movements.complete')) {
      throw createPermissionError('Insufficient permissions to complete asset movements');
    }

    const movement = await AssetMovement.findOne({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
      transaction,
    });

    if (!movement) {
      throw createValidationError('Movement not found', 'movementId');
    }

    if (movement.status === 'completed') {
      throw createValidationError(
        'Movement is already completed',
        'status'
      );
    }

    if (movement.status === 'cancelled') {
      throw createValidationError(
        'Cannot complete cancelled movement',
        'status'
      );
    }

    if (movement.status === 'draft') {
      throw createValidationError(
        'Movement must be approved before completion',
        'status'
      );
    }

    // Get the asset
    const asset = await FixedAsset.findByPk(movement.assetId, { transaction });

    if (!asset) {
      throw createValidationError('Asset not found', 'assetId');
    }

    // Update asset with new location/department/user
    const updateData: any = {};

    if (movement.toLocationId) {
      updateData.locationId = movement.toLocationId;
    }

    if (movement.toDepartmentId) {
      updateData.departmentId = movement.toDepartmentId;
    }

    if (movement.toUserId) {
      updateData.assignedToUserId = movement.toUserId;
    }

    await asset.update(updateData, { transaction });

    // Mark movement as completed
    await movement.update(
      {
        status: 'completed',
        completedBy: user.id,
        completedAt: new Date(),
      },
      { transaction }
    );

    await transaction.commit();

    logger.info('Asset movement completed', {
      movementId: movement.id,
      movementNumber: movement.movementNumber,
      assetId: asset.id,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Movement completed successfully',
      movement,
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('Error completing asset movement', { movementId: params.id, error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
