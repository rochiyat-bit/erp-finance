import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AssetDepreciation, FixedAsset, AssetCategory, FiscalPeriod } from '@/lib/db/models';
import { listDepreciationsQuerySchema } from '@/lib/validators/fa';
import { createPermissionError, formatErrorResponse } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';
import { Op } from 'sequelize';

// GET /api/fa/depreciations
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    if (!hasPermission(user, 'fa.depreciations.view')) {
      throw createPermissionError('Insufficient permissions to view depreciations');
    }

    const { searchParams } = new URL(req.url);
    const params = Object.fromEntries(searchParams.entries());

    const validation = listDepreciationsQuerySchema.safeParse(params);

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

    const { page, limit, assetId, fiscalPeriodId, status } = validation.data;

    const where: any = {
      companyId: user.companyId,
    };

    if (assetId) {
      where.assetId = assetId;
    }

    if (fiscalPeriodId) {
      where.fiscalPeriodId = fiscalPeriodId;
    }

    if (status) {
      where.status = status;
    }

    const offset = (page - 1) * limit;

    const { rows: depreciations, count: total } = await AssetDepreciation.findAndCountAll({
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
          model: FiscalPeriod,
          as: 'fiscalPeriod',
        },
      ],
      limit,
      offset,
      order: [['depreciationDate', 'DESC']],
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      depreciations,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    logger.error('Error fetching depreciations', { error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
