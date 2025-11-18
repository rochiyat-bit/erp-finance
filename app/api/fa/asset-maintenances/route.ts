import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AssetMaintenance, FixedAsset, AssetCategory } from '@/lib/db/models';
import sequelize from '@/lib/db/sequelize';
import { createAssetMaintenanceSchema, listMaintenancesQuerySchema } from '@/lib/validators/fa';
import { createPermissionError, createValidationError, formatErrorResponse } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';
import { Op } from 'sequelize';

// Helper function to generate maintenance number
async function generateMaintenanceNumber(
  companyId: string,
  transaction: any
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `MAINT-${year}-`;

  const lastMaintenance = await AssetMaintenance.findOne({
    where: {
      companyId,
      maintenanceNumber: {
        [Op.like]: `${prefix}%`,
      },
    },
    order: [['createdAt', 'DESC']],
    transaction,
  });

  let nextNumber = 1;
  if (lastMaintenance) {
    const lastNumber = parseInt(lastMaintenance.maintenanceNumber.split('-')[2]);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(5, '0')}`;
}

// GET /api/fa/asset-maintenances
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    if (!hasPermission(user, 'fa.maintenances.view')) {
      throw createPermissionError('Insufficient permissions to view asset maintenances');
    }

    const { searchParams } = new URL(req.url);
    const params = Object.fromEntries(searchParams.entries());

    const validation = listMaintenancesQuerySchema.safeParse(params);

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

    const { page, limit, assetId, maintenanceType, status, startDate, endDate } = validation.data;

    const where: any = {
      companyId: user.companyId,
    };

    if (assetId) {
      where.assetId = assetId;
    }

    if (maintenanceType) {
      where.maintenanceType = maintenanceType;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.maintenanceDate = {};
      if (startDate) {
        where.maintenanceDate[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.maintenanceDate[Op.lte] = new Date(endDate);
      }
    }

    const offset = (page - 1) * limit;

    const { rows: maintenances, count: total } = await AssetMaintenance.findAndCountAll({
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
      ],
      limit,
      offset,
      order: [['maintenanceDate', 'DESC']],
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      maintenances,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    logger.error('Error fetching asset maintenances', { error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// POST /api/fa/asset-maintenances
export async function POST(req: NextRequest) {
  const transaction = await sequelize.transaction();

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    if (!hasPermission(user, 'fa.maintenances.create')) {
      throw createPermissionError('Insufficient permissions to create asset maintenances');
    }

    const body = await req.json();
    const validation = createAssetMaintenanceSchema.safeParse(body);

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

    // Generate maintenance number
    const maintenanceNumber = await generateMaintenanceNumber(user.companyId, transaction);

    // Calculate total cost
    const totalCost =
      Number(data.laborCost || 0) +
      Number(data.partsCost || 0) +
      Number(data.otherCosts || 0);

    // Create maintenance
    const maintenance = await AssetMaintenance.create(
      {
        ...data,
        companyId: user.companyId,
        maintenanceNumber,
        maintenanceDate: new Date(data.maintenanceDate),
        totalCost,
        nextMaintenanceDate: data.nextMaintenanceDate
          ? new Date(data.nextMaintenanceDate)
          : null,
        createdBy: user.id,
      },
      { transaction }
    );

    // If maintenance type is breakdown, set asset status to under_maintenance
    if (data.maintenanceType === 'breakdown' && data.status === 'in_progress') {
      await asset.update(
        {
          status: 'under_maintenance',
        },
        { transaction }
      );
    }

    await transaction.commit();

    logger.info('Asset maintenance created', {
      maintenanceId: maintenance.id,
      maintenanceNumber: maintenance.maintenanceNumber,
      assetId: asset.id,
      userId: user.id,
    });

    return NextResponse.json(
      {
        success: true,
        maintenance,
      },
      { status: 201 }
    );
  } catch (error) {
    await transaction.rollback();
    logger.error('Error creating asset maintenance', { error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
