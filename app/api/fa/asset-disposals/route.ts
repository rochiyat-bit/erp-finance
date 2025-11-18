import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AssetDisposal, FixedAsset, AssetCategory } from '@/lib/db/models';
import sequelize from '@/lib/db/sequelize';
import { createAssetDisposalSchema, listDisposalsQuerySchema } from '@/lib/validators/fa';
import { createPermissionError, createValidationError, formatErrorResponse } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';
import { Op } from 'sequelize';

// Helper function to generate disposal number
async function generateDisposalNumber(
  companyId: string,
  transaction: any
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `DISP-${year}-`;

  const lastDisposal = await AssetDisposal.findOne({
    where: {
      companyId,
      disposalNumber: {
        [Op.like]: `${prefix}%`,
      },
    },
    order: [['createdAt', 'DESC']],
    transaction,
  });

  let nextNumber = 1;
  if (lastDisposal) {
    const lastNumber = parseInt(lastDisposal.disposalNumber.split('-')[2]);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(5, '0')}`;
}

// GET /api/fa/asset-disposals
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    if (!hasPermission(user, 'fa.disposals.view')) {
      throw createPermissionError('Insufficient permissions to view asset disposals');
    }

    const { searchParams } = new URL(req.url);
    const params = Object.fromEntries(searchParams.entries());

    const validation = listDisposalsQuerySchema.safeParse(params);

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

    const { page, limit, disposalMethod, startDate, endDate } = validation.data;

    const where: any = {
      companyId: user.companyId,
    };

    if (disposalMethod) {
      where.disposalMethod = disposalMethod;
    }

    if (startDate || endDate) {
      where.disposalDate = {};
      if (startDate) {
        where.disposalDate[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.disposalDate[Op.lte] = new Date(endDate);
      }
    }

    const offset = (page - 1) * limit;

    const { rows: disposals, count: total } = await AssetDisposal.findAndCountAll({
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
      order: [['disposalDate', 'DESC']],
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      disposals,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    logger.error('Error fetching asset disposals', { error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// POST /api/fa/asset-disposals
export async function POST(req: NextRequest) {
  const transaction = await sequelize.transaction();

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    if (!hasPermission(user, 'fa.disposals.create')) {
      throw createPermissionError('Insufficient permissions to create asset disposals');
    }

    const body = await req.json();
    const validation = createAssetDisposalSchema.safeParse(body);

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

    // Check asset is not already disposed
    if (['disposed', 'sold', 'scrapped', 'stolen', 'lost'].includes(asset.status)) {
      throw createValidationError(
        'Asset is already disposed',
        'assetId'
      );
    }

    // Generate disposal number
    const disposalNumber = await generateDisposalNumber(user.companyId, transaction);

    // Calculate gain/loss
    const originalCost = Number(asset.totalCost);
    const accumulatedDepreciation = Number(asset.accumulatedDepreciation);
    const bookValue = Number(asset.bookValue);

    const saleAmount = Number(data.saleAmount || 0);
    const tradeInValue = Number(data.tradeInValue || 0);
    const disposalCosts = Number(data.disposalCosts || 0);

    // Total proceeds = sale amount or trade-in value minus disposal costs
    let totalProceeds = 0;
    if (data.disposalMethod === 'sold') {
      totalProceeds = saleAmount - disposalCosts;
    } else if (data.disposalMethod === 'traded') {
      totalProceeds = tradeInValue - disposalCosts;
    } else {
      totalProceeds = -disposalCosts; // Only costs, no proceeds
    }

    // Gain/Loss = Total Proceeds - Book Value
    const gainLoss = totalProceeds - bookValue;

    let gainLossType: 'gain' | 'loss' | 'break_even';
    if (gainLoss > 0) {
      gainLossType = 'gain';
    } else if (gainLoss < 0) {
      gainLossType = 'loss';
    } else {
      gainLossType = 'break_even';
    }

    // Create disposal
    const disposal = await AssetDisposal.create(
      {
        ...data,
        companyId: user.companyId,
        disposalNumber,
        disposalDate: new Date(data.disposalDate),
        originalCost,
        accumulatedDepreciation,
        bookValue,
        totalProceeds,
        gainLoss,
        gainLossType,
        isPosted: false,
        createdBy: user.id,
      },
      { transaction }
    );

    await transaction.commit();

    logger.info('Asset disposal created', {
      disposalId: disposal.id,
      disposalNumber: disposal.disposalNumber,
      assetId: asset.id,
      userId: user.id,
    });

    return NextResponse.json(
      {
        success: true,
        disposal,
        message: 'Disposal created. You can now post it to GL.',
      },
      { status: 201 }
    );
  } catch (error) {
    await transaction.rollback();
    logger.error('Error creating asset disposal', { error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
