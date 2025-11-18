import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AssetMaintenance, FixedAsset } from '@/lib/db/models';
import sequelize from '@/lib/db/sequelize';
import { createPermissionError, createValidationError, formatErrorResponse } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';

// POST /api/fa/asset-maintenances/:id/complete
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

    if (!hasPermission(user, 'fa.maintenances.complete')) {
      throw createPermissionError('Insufficient permissions to complete asset maintenances');
    }

    const maintenance = await AssetMaintenance.findOne({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
      transaction,
    });

    if (!maintenance) {
      throw createValidationError('Maintenance not found', 'maintenanceId');
    }

    if (maintenance.status === 'completed') {
      throw createValidationError(
        'Maintenance is already completed',
        'status'
      );
    }

    if (maintenance.status === 'cancelled') {
      throw createValidationError(
        'Cannot complete cancelled maintenance',
        'status'
      );
    }

    // Get the asset
    const asset = await FixedAsset.findByPk(maintenance.assetId, { transaction });

    if (!asset) {
      throw createValidationError('Asset not found', 'assetId');
    }

    // Mark maintenance as completed
    await maintenance.update(
      {
        status: 'completed',
        completedBy: user.id,
        completedAt: new Date(),
      },
      { transaction }
    );

    // If asset is under maintenance, set it back to active
    if (asset.status === 'under_maintenance') {
      await asset.update(
        {
          status: 'active',
        },
        { transaction }
      );
    }

    // Schedule next maintenance if specified
    if (maintenance.nextMaintenanceDate) {
      await asset.update(
        {
          nextMaintenanceDate: maintenance.nextMaintenanceDate,
        },
        { transaction }
      );
    }

    await transaction.commit();

    logger.info('Asset maintenance completed', {
      maintenanceId: maintenance.id,
      maintenanceNumber: maintenance.maintenanceNumber,
      assetId: asset.id,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Maintenance completed successfully',
      maintenance,
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('Error completing asset maintenance', { maintenanceId: params.id, error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
