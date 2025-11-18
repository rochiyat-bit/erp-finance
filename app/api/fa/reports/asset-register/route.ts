import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FixedAsset, AssetCategory, AssetLocation } from '@/lib/db/models';
import { createPermissionError, formatErrorResponse } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';
import { Op } from 'sequelize';
import sequelize from '@/lib/db/sequelize';

// GET /api/fa/reports/asset-register
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    if (!hasPermission(user, 'fa.reports.view')) {
      throw createPermissionError('Insufficient permissions to view FA reports');
    }

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const locationId = searchParams.get('locationId');
    const status = searchParams.get('status');
    const asOfDate = searchParams.get('asOfDate');

    const where: any = {
      companyId: user.companyId,
    };

    if (categoryId) {
      where.assetCategoryId = categoryId;
    }

    if (locationId) {
      where.locationId = locationId;
    }

    if (status) {
      where.status = status;
    }

    if (asOfDate) {
      where.acquisitionDate = {
        [Op.lte]: new Date(asOfDate),
      };
    }

    const assets = await FixedAsset.findAll({
      where,
      include: [
        {
          model: AssetCategory,
          as: 'category',
          attributes: ['categoryCode', 'categoryName'],
        },
        {
          model: AssetLocation,
          as: 'location',
          attributes: ['locationCode', 'locationName'],
        },
      ],
      order: [['assetNumber', 'ASC']],
    });

    // Calculate summary totals
    const summary = await FixedAsset.findOne({
      where,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalAssets'],
        [sequelize.fn('SUM', sequelize.col('total_cost')), 'totalCost'],
        [sequelize.fn('SUM', sequelize.col('accumulated_depreciation')), 'totalAccumulatedDepreciation'],
        [sequelize.fn('SUM', sequelize.col('book_value')), 'totalBookValue'],
      ],
      raw: true,
    });

    // Group by category for subtotals
    const categorySubtotals = await FixedAsset.findAll({
      where,
      attributes: [
        'assetCategoryId',
        [sequelize.fn('COUNT', sequelize.col('FixedAsset.id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total_cost')), 'totalCost'],
        [sequelize.fn('SUM', sequelize.col('accumulated_depreciation')), 'totalAccumulatedDepreciation'],
        [sequelize.fn('SUM', sequelize.col('book_value')), 'totalBookValue'],
      ],
      include: [
        {
          model: AssetCategory,
          as: 'category',
          attributes: ['categoryCode', 'categoryName'],
        },
      ],
      group: ['assetCategoryId', 'category.id'],
      raw: false,
    });

    return NextResponse.json({
      success: true,
      report: {
        title: 'Fixed Asset Register',
        generatedAt: new Date(),
        asOfDate: asOfDate || new Date(),
        filters: {
          categoryId,
          locationId,
          status,
        },
        assets,
        summary: {
          totalAssets: parseInt(summary?.totalAssets || '0'),
          totalCost: Number(summary?.totalCost || 0),
          totalAccumulatedDepreciation: Number(summary?.totalAccumulatedDepreciation || 0),
          totalBookValue: Number(summary?.totalBookValue || 0),
        },
        categorySubtotals,
      },
    });
  } catch (error) {
    logger.error('Error generating asset register report', { error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
