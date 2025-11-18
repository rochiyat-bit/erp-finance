import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FixedAsset, AssetCategory, AssetLocation } from '@/lib/db/models';
import { createFixedAssetSchema, listAssetsQuerySchema } from '@/lib/validators/fa';
import { createPermissionError, createValidationError, formatErrorResponse } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';
import { Op, Transaction } from 'sequelize';
import sequelize from '@/lib/db/sequelize';
import { generateDepreciationSchedule } from '@/lib/fa/depreciation-calculator';

// Helper function to generate asset number
async function generateAssetNumber(companyId: string, transaction?: Transaction): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `FA-${year}-`;

  const lastAsset = await FixedAsset.findOne({
    where: {
      companyId,
      assetNumber: {
        [Op.like]: `${prefix}%`,
      },
    },
    order: [['createdAt', 'DESC']],
    transaction,
  });

  let nextNumber = 1;
  if (lastAsset) {
    const lastNumberStr = lastAsset.assetNumber.replace(prefix, '');
    const lastNumber = parseInt(lastNumberStr, 10);
    nextNumber = lastNumber + 1;
  }

  const paddedNumber = nextNumber.toString().padStart(5, '0');
  return `${prefix}${paddedNumber}`;
}

// GET /api/fa/assets - List assets
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    if (!hasPermission(user, 'fa.assets.view')) {
      throw createPermissionError('Insufficient permissions to view assets');
    }

    const { searchParams } = new URL(req.url);
    const query = listAssetsQuerySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      status: searchParams.get('status'),
      categoryId: searchParams.get('categoryId'),
      locationId: searchParams.get('locationId'),
      departmentId: searchParams.get('departmentId'),
      acquisitionDateFrom: searchParams.get('acquisitionDateFrom'),
      acquisitionDateTo: searchParams.get('acquisitionDateTo'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    });

    const where: any = {
      companyId: user.companyId,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.categoryId) {
      where.assetCategoryId = query.categoryId;
    }

    if (query.locationId) {
      where.locationId = query.locationId;
    }

    if (query.departmentId) {
      where.departmentId = query.departmentId;
    }

    if (query.search) {
      where[Op.or] = [
        { assetNumber: { [Op.iLike]: `%${query.search}%` } },
        { assetName: { [Op.iLike]: `%${query.search}%` } },
        { serialNumber: { [Op.iLike]: `%${query.search}%` } },
        { barcode: { [Op.iLike]: `%${query.search}%` } },
      ];
    }

    if (query.acquisitionDateFrom && query.acquisitionDateTo) {
      where.acquisitionDate = {
        [Op.between]: [new Date(query.acquisitionDateFrom), new Date(query.acquisitionDateTo)],
      };
    }

    const limit = query.limit;
    const offset = (query.page - 1) * limit;

    const sortField = query.sortBy;
    const sortDirection = query.sortOrder.toUpperCase();

    const { count, rows: assets } = await FixedAsset.findAndCountAll({
      where,
      include: [
        {
          model: AssetCategory,
          as: 'category',
          attributes: ['id', 'categoryCode', 'categoryName'],
        },
        {
          model: AssetLocation,
          as: 'location',
          attributes: ['id', 'locationCode', 'locationName'],
        },
      ],
      order: [[sortField, sortDirection]],
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      assets,
      pagination: {
        page: query.page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    logger.error('Error listing assets', { error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// POST /api/fa/assets - Create asset
export async function POST(req: NextRequest) {
  let transaction: Transaction | null = null;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    if (!hasPermission(user, 'fa.assets.create')) {
      throw createPermissionError('Insufficient permissions to create assets');
    }

    const body = await req.json();
    const validation = createFixedAssetSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      throw createValidationError(firstError.message, firstError.path.join('.'));
    }

    const data = validation.data;

    transaction = await sequelize.transaction();

    // Verify category exists
    const category = await AssetCategory.findOne({
      where: {
        id: data.assetCategoryId,
        companyId: user.companyId,
      },
      transaction,
    });

    if (!category) {
      throw createValidationError('Asset category not found', 'assetCategoryId');
    }

    // Generate asset number
    const assetNumber = await generateAssetNumber(user.companyId, transaction);

    // Calculate total cost
    const totalCost = Number(data.acquisitionCost) + Number(data.additionalCosts || 0);

    // Calculate useful life in months if only years provided
    let usefulLifeMonths = data.usefulLifeMonths;
    if (!usefulLifeMonths && data.usefulLifeYears) {
      usefulLifeMonths = data.usefulLifeYears * 12;
    }

    // Set book value initially to total cost
    const bookValue = totalCost;
    const remainingValue = bookValue - Number(data.salvageValue);

    // Create asset
    const asset = await FixedAsset.create({
      ...data,
      companyId: user.companyId,
      assetNumber,
      totalCost,
      usefulLifeMonths,
      bookValue,
      accumulatedDepreciation: 0,
      remainingValue,
      status: 'active',
      isRevalued: false,
      createdBy: user.id,
      updatedBy: user.id,
    }, { transaction });

    await transaction.commit();

    // Generate depreciation schedule (async, not awaited)
    const schedule = await generateDepreciationSchedule(asset.id);

    logger.info('Fixed asset created', {
      assetId: asset.id,
      assetNumber: asset.assetNumber,
      userId: user.id,
    });

    return NextResponse.json(
      {
        success: true,
        asset,
        depreciationSchedule: schedule.slice(0, 12), // Return first year
      },
      { status: 201 }
    );
  } catch (error) {
    if (transaction) await transaction.rollback();

    logger.error('Error creating fixed asset', { error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
