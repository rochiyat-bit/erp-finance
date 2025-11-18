import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AssetRevaluation, FixedAsset, AssetCategory } from '@/lib/db/models';
import sequelize from '@/lib/db/sequelize';
import { createAssetRevaluationSchema } from '@/lib/validators/fa';
import { createPermissionError, createValidationError, formatErrorResponse } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';
import { Op } from 'sequelize';

// Helper function to generate revaluation number
async function generateRevaluationNumber(
  companyId: string,
  transaction: any
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `REV-${year}-`;

  const lastRevaluation = await AssetRevaluation.findOne({
    where: {
      companyId,
      revaluationNumber: {
        [Op.like]: `${prefix}%`,
      },
    },
    order: [['createdAt', 'DESC']],
    transaction,
  });

  let nextNumber = 1;
  if (lastRevaluation) {
    const lastNumber = parseInt(lastRevaluation.revaluationNumber.split('-')[2]);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(5, '0')}`;
}

// GET /api/fa/asset-revaluations
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    if (!hasPermission(user, 'fa.revaluations.view')) {
      throw createPermissionError('Insufficient permissions to view asset revaluations');
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const assetId = searchParams.get('assetId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {
      companyId: user.companyId,
    };

    if (assetId) {
      where.assetId = assetId;
    }

    if (startDate || endDate) {
      where.revaluationDate = {};
      if (startDate) {
        where.revaluationDate[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.revaluationDate[Op.lte] = new Date(endDate);
      }
    }

    const offset = (page - 1) * limit;

    const { rows: revaluations, count: total } = await AssetRevaluation.findAndCountAll({
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
      order: [['revaluationDate', 'DESC']],
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      revaluations,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    logger.error('Error fetching asset revaluations', { error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// POST /api/fa/asset-revaluations
export async function POST(req: NextRequest) {
  const transaction = await sequelize.transaction();

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    if (!hasPermission(user, 'fa.revaluations.create')) {
      throw createPermissionError('Insufficient permissions to create asset revaluations');
    }

    const body = await req.json();
    const validation = createAssetRevaluationSchema.safeParse(body);

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
        'Only active assets can be revalued',
        'assetId'
      );
    }

    // Generate revaluation number
    const revaluationNumber = await generateRevaluationNumber(user.companyId, transaction);

    // Calculate gain/loss
    const previousBookValue = Number(asset.bookValue);
    const revaluedAmount = Number(data.revaluedAmount);
    const revaluationGainLoss = revaluedAmount - previousBookValue;

    // Create revaluation
    const revaluation = await AssetRevaluation.create(
      {
        ...data,
        companyId: user.companyId,
        revaluationNumber,
        revaluationDate: new Date(data.revaluationDate),
        previousBookValue,
        revaluationGainLoss,
        isPosted: false,
        createdBy: user.id,
      },
      { transaction }
    );

    await transaction.commit();

    logger.info('Asset revaluation created', {
      revaluationId: revaluation.id,
      revaluationNumber: revaluation.revaluationNumber,
      assetId: asset.id,
      userId: user.id,
    });

    return NextResponse.json(
      {
        success: true,
        revaluation,
        message: 'Revaluation created. You can now post it to GL.',
      },
      { status: 201 }
    );
  } catch (error) {
    await transaction.rollback();
    logger.error('Error creating asset revaluation', { error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
