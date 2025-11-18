import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AssetLocation, FixedAsset } from '@/lib/db/models';
import { updateAssetLocationSchema } from '@/lib/validators/fa';
import { createPermissionError, createValidationError, formatErrorResponse } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';

// GET /api/fa/asset-locations/:id
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

    if (!hasPermission(user, 'fa.locations.view')) {
      throw createPermissionError('Insufficient permissions to view asset locations');
    }

    const location = await AssetLocation.findOne({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!location) {
      throw createValidationError('Asset location not found', 'locationId');
    }

    // Get assets at this location
    const assets = await FixedAsset.findAll({
      where: {
        locationId: location.id,
        companyId: user.companyId,
      },
      attributes: ['id', 'assetNumber', 'assetName', 'status', 'bookValue'],
      order: [['assetNumber', 'ASC']],
    });

    return NextResponse.json({
      success: true,
      location,
      assets,
      assetCount: assets.length,
    });
  } catch (error) {
    logger.error('Error fetching asset location', { locationId: params.id, error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// PATCH /api/fa/asset-locations/:id
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

    if (!hasPermission(user, 'fa.locations.manage')) {
      throw createPermissionError('Insufficient permissions to edit asset locations');
    }

    const location = await AssetLocation.findOne({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!location) {
      throw createValidationError('Asset location not found', 'locationId');
    }

    const body = await req.json();
    const validation = updateAssetLocationSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      throw createValidationError(firstError.message, firstError.path.join('.'));
    }

    const data = validation.data;

    // Check for duplicate location code if changing
    if (data.locationCode && data.locationCode !== location.locationCode) {
      const existing = await AssetLocation.findOne({
        where: {
          companyId: user.companyId,
          locationCode: data.locationCode,
        },
      });

      if (existing) {
        throw createValidationError('Location code already exists', 'locationCode');
      }
    }

    await location.update(data);

    logger.info('Asset location updated', {
      locationId: location.id,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      location,
    });
  } catch (error) {
    logger.error('Error updating asset location', { locationId: params.id, error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// DELETE /api/fa/asset-locations/:id
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

    if (!hasPermission(user, 'fa.locations.manage')) {
      throw createPermissionError('Insufficient permissions to delete asset locations');
    }

    const location = await AssetLocation.findOne({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!location) {
      throw createValidationError('Asset location not found', 'locationId');
    }

    // Check if location has assets
    const assetCount = await FixedAsset.count({
      where: {
        locationId: location.id,
      },
    });

    if (assetCount > 0) {
      throw createValidationError(
        `Cannot delete location with ${assetCount} asset(s). Please reassign or remove assets first.`,
        'locationId'
      );
    }

    await location.destroy();

    logger.info('Asset location deleted', {
      locationId: params.id,
      locationCode: location.locationCode,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: `Asset location ${location.locationCode} deleted successfully`,
    });
  } catch (error) {
    logger.error('Error deleting asset location', { locationId: params.id, error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
