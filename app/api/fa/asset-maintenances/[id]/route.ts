import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AssetMaintenance, FixedAsset, AssetCategory } from '@/lib/db/models';
import { updateAssetMaintenanceSchema } from '@/lib/validators/fa';
import { createPermissionError, createValidationError, formatErrorResponse } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';

// GET /api/fa/asset-maintenances/:id
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

    if (!hasPermission(user, 'fa.maintenances.view')) {
      throw createPermissionError('Insufficient permissions to view asset maintenances');
    }

    const maintenance = await AssetMaintenance.findOne({
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
      ],
    });

    if (!maintenance) {
      throw createValidationError('Maintenance not found', 'maintenanceId');
    }

    return NextResponse.json({
      success: true,
      maintenance,
    });
  } catch (error) {
    logger.error('Error fetching asset maintenance', { maintenanceId: params.id, error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// PATCH /api/fa/asset-maintenances/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    if (!hasPermission(user, 'fa.maintenances.edit')) {
      throw createPermissionError('Insufficient permissions to edit asset maintenances');
    }

    const maintenance = await AssetMaintenance.findOne({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!maintenance) {
      throw createValidationError('Maintenance not found', 'maintenanceId');
    }

    const body = await req.json();
    const validation = updateAssetMaintenanceSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      throw createValidationError(firstError.message, firstError.path.join('.'));
    }

    const data = validation.data;

    // Recalculate total cost if any cost field changed
    let totalCost = Number(maintenance.totalCost);
    if (data.laborCost !== undefined || data.partsCost !== undefined || data.otherCosts !== undefined) {
      totalCost =
        Number(data.laborCost ?? maintenance.laborCost) +
        Number(data.partsCost ?? maintenance.partsCost) +
        Number(data.otherCosts ?? maintenance.otherCosts);
    }

    await maintenance.update({
      ...data,
      totalCost,
      updatedBy: user.id,
    });

    logger.info('Asset maintenance updated', {
      maintenanceId: maintenance.id,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      maintenance,
    });
  } catch (error) {
    logger.error('Error updating asset maintenance', { maintenanceId: params.id, error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
