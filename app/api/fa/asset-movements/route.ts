import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AssetMovement, FixedAsset, AssetCategory, AssetLocation } from '@/lib/db/models';
import sequelize from '@/lib/db/sequelize';
import { createAssetMovementSchema, listMovementsQuerySchema } from '@/lib/validators/fa';
import { createPermissionError, createValidationError, formatErrorResponse } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';
import { Op } from 'sequelize';

// Helper function to generate movement number
async function generateMovementNumber(
  companyId: string,
  transaction: any
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `MOV-${year}-`;

  const lastMovement = await AssetMovement.findOne({
    where: {
      companyId,
      movementNumber: {
        [Op.like]: `${prefix}%`,
      },
    },
    order: [['createdAt', 'DESC']],
    transaction,
  });

  let nextNumber = 1;
  if (lastMovement) {
    const lastNumber = parseInt(lastMovement.movementNumber.split('-')[2]);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(5, '0')}`;
}

// GET /api/fa/asset-movements
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    if (!hasPermission(user, 'fa.movements.view')) {
      throw createPermissionError('Insufficient permissions to view asset movements');
    }

    const { searchParams } = new URL(req.url);
    const params = Object.fromEntries(searchParams.entries());

    const validation = listMovementsQuerySchema.safeParse(params);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return NextResponse.json(
        {
          success: false,
          error: firstError.message,
          field: firstError.path.join('.'),
        },
        { status: 400 }
      );
    }

    const { page, limit, assetId, movementType, status } = validation.data;

    const where: any = {
      companyId: user.companyId,
    };

    if (assetId) {
      where.assetId = assetId;
    }

    if (movementType) {
      where.movementType = movementType;
    }

    if (status) {
      where.status = status;
    }

    const offset = (page - 1) * limit;

    const { rows: movements, count: total } = await AssetMovement.findAndCountAll({
      where,
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
      limit,
      offset,
      order: [['movementDate', 'DESC']],
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      movements,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    logger.error('Error fetching asset movements', { error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// POST /api/fa/asset-movements
export async function POST(req: NextRequest) {
  const transaction = await sequelize.transaction();

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    if (!hasPermission(user, 'fa.movements.create')) {
      throw createPermissionError('Insufficient permissions to create asset movements');
    }

    const body = await req.json();
    const validation = createAssetMovementSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      throw createValidationError(firstError.message, firstError.path.join('.'));
    }

    const data = validation.data;

    // Verify asset exists
    const asset = await FixedAsset.findOne({
      where: {
        id: data.assetId,
        companyId: user.companyId,
      },
      transaction,
    });

    if (!asset) {
      throw createValidationError('Asset not found', 'assetId');
    }

    // Check asset is active
    if (asset.status !== 'active') {
      throw createValidationError(
        'Cannot move non-active assets',
        'assetId'
      );
    }

    // Generate movement number
    const movementNumber = await generateMovementNumber(user.companyId, transaction);

    // Create movement
    const movement = await AssetMovement.create(
      {
        ...data,
        companyId: user.companyId,
        movementNumber,
        movementDate: new Date(data.movementDate),
        status: data.requiresApproval ? 'draft' : 'approved',
        createdBy: user.id,
      },
      { transaction }
    );

    // If no approval required, complete the movement immediately
    if (!data.requiresApproval) {
      // Update asset
      const updateData: any = {};

      if (data.toLocationId) {
        updateData.locationId = data.toLocationId;
      }

      if (data.toDepartmentId) {
        updateData.departmentId = data.toDepartmentId;
      }

      if (data.toUserId) {
        updateData.assignedToUserId = data.toUserId;
      }

      await asset.update(updateData, { transaction });

      await movement.update(
        {
          status: 'completed',
          completedBy: user.id,
          completedAt: new Date(),
        },
        { transaction }
      );
    }

    await transaction.commit();

    logger.info('Asset movement created', {
      movementId: movement.id,
      movementNumber: movement.movementNumber,
      assetId: asset.id,
      userId: user.id,
    });

    return NextResponse.json(
      {
        success: true,
        movement,
        message: data.requiresApproval
          ? 'Movement created and pending approval'
          : 'Movement created and completed',
      },
      { status: 201 }
    );
  } catch (error) {
    await transaction.rollback();
    logger.error('Error creating asset movement', { error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
