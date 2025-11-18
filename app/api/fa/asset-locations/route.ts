import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AssetLocation } from '@/lib/db/models';
import { createAssetLocationSchema } from '@/lib/validators/fa';
import { createPermissionError, createValidationError, formatErrorResponse } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';

// GET /api/fa/asset-locations - List locations
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    if (!hasPermission(user, 'fa.locations.view')) {
      throw createPermissionError('Insufficient permissions to view asset locations');
    }

    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const where: any = {
      companyId: user.companyId,
    };

    if (!includeInactive) {
      where.isActive = true;
    }

    const locations = await AssetLocation.findAll({
      where,
      order: [['locationCode', 'ASC']],
    });

    return NextResponse.json({
      success: true,
      locations,
    });
  } catch (error) {
    logger.error('Error listing asset locations', { error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// POST /api/fa/asset-locations - Create location
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    if (!hasPermission(user, 'fa.locations.manage')) {
      throw createPermissionError('Insufficient permissions to create asset locations');
    }

    const body = await req.json();
    const validation = createAssetLocationSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      throw createValidationError(firstError.message, firstError.path.join('.'));
    }

    const data = validation.data;

    // Check for duplicate location code
    const existing = await AssetLocation.findOne({
      where: {
        companyId: user.companyId,
        locationCode: data.locationCode,
      },
    });

    if (existing) {
      throw createValidationError('Location code already exists', 'locationCode');
    }

    // Validate parent if provided
    if (data.parentLocationId) {
      const parent = await AssetLocation.findOne({
        where: {
          id: data.parentLocationId,
          companyId: user.companyId,
        },
      });

      if (!parent) {
        throw createValidationError('Parent location not found', 'parentLocationId');
      }
    }

    const location = await AssetLocation.create({
      ...data,
      companyId: user.companyId,
    });

    logger.info('Asset location created', {
      locationId: location.id,
      locationCode: location.locationCode,
      userId: user.id,
    });

    return NextResponse.json(
      {
        success: true,
        location,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error creating asset location', { error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
