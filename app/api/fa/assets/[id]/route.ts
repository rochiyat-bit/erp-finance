import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FixedAsset, AssetCategory, AssetLocation, AssetDepreciation, AssetMovement, AssetMaintenance } from '@/lib/db/models';
import { updateFixedAssetSchema } from '@/lib/validators/fa';
import { createPermissionError, createValidationError, formatErrorResponse } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';

// GET /api/fa/assets/:id
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

    if (!hasPermission(user, 'fa.assets.view')) {
      throw createPermissionError('Insufficient permissions to view assets');
    }

    const asset = await FixedAsset.findOne({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
      include: [
        {
          model: AssetCategory,
          as: 'category',
        },
        {
          model: AssetLocation,
          as: 'location',
        },
        {
          model: AssetDepreciation,
          as: 'depreciations',
          limit: 12,
          order: [['depreciationDate', 'DESC']],
        },
        {
          model: AssetMovement,
          as: 'movements',
          limit: 5,
          order: [['movementDate', 'DESC']],
        },
        {
          model: AssetMaintenance,
          as: 'maintenances',
          limit: 5,
          order: [['maintenanceDate', 'DESC']],
        },
      ],
    });

    if (!asset) {
      throw createValidationError('Asset not found', 'assetId');
    }

    return NextResponse.json({
      success: true,
      asset,
    });
  } catch (error) {
    logger.error('Error fetching asset', { assetId: params.id, error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// PATCH /api/fa/assets/:id
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

    if (!hasPermission(user, 'fa.assets.edit')) {
      throw createPermissionError('Insufficient permissions to edit assets');
    }

    const asset = await FixedAsset.findOne({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!asset) {
      throw createValidationError('Asset not found', 'assetId');
    }

    // Check if asset has posted depreciation - cannot modify financial details
    const hasPostedDepreciation = await AssetDepreciation.findOne({
      where: {
        assetId: asset.id,
        isPosted: true,
      },
    });

    const body = await req.json();
    const validation = updateFixedAssetSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      throw createValidationError(firstError.message, firstError.path.join('.'));
    }

    const data = validation.data;

    // Prevent changing financial fields if depreciation posted
    if (hasPostedDepreciation) {
      const financialFields = ['acquisitionCost', 'additionalCosts', 'salvageValue', 'depreciationMethod', 'usefulLifeYears', 'usefulLifeMonths'];
      const changedFinancialFields = financialFields.filter(field => data[field as keyof typeof data] !== undefined);

      if (changedFinancialFields.length > 0) {
        throw createValidationError(
          'Cannot modify financial details after depreciation has been posted',
          changedFinancialFields[0]
        );
      }
    }

    await asset.update({
      ...data,
      updatedBy: user.id,
    });

    logger.info('Fixed asset updated', {
      assetId: asset.id,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      asset,
    });
  } catch (error) {
    logger.error('Error updating asset', { assetId: params.id, error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// DELETE /api/fa/assets/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    if (!hasPermission(user, 'fa.assets.delete')) {
      throw createPermissionError('Insufficient permissions to delete assets');
    }

    const asset = await FixedAsset.findOne({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!asset) {
      throw createValidationError('Asset not found', 'assetId');
    }

    // Check if asset has posted depreciation
    const hasPostedDepreciation = await AssetDepreciation.findOne({
      where: {
        assetId: asset.id,
        isPosted: true,
      },
    });

    if (hasPostedDepreciation) {
      throw createValidationError(
        'Cannot delete asset with posted depreciation. Please dispose the asset instead.',
        'assetId'
      );
    }

    await asset.destroy();

    logger.info('Fixed asset deleted', {
      assetId: params.id,
      assetNumber: asset.assetNumber,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: `Asset ${asset.assetNumber} deleted successfully`,
    });
  } catch (error) {
    logger.error('Error deleting asset', { assetId: params.id, error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
