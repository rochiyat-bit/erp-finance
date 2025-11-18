import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FixedAsset, AssetDepreciation, AssetMaintenance } from '@/lib/db/models';
import { createPermissionError, formatErrorResponse } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';
import { Op } from 'sequelize';
import sequelize from '@/lib/db/sequelize';

// GET /api/fa/dashboard/stats
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    if (!hasPermission(user, 'fa.dashboard.view')) {
      throw createPermissionError('Insufficient permissions to view FA dashboard');
    }

    const where = { companyId: user.companyId };

    // 1. Asset counts by status
    const assetCountsByStatus = await FixedAsset.findAll({
      where,
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['status'],
      raw: true,
    });

    // 2. Total asset value metrics
    const assetValueMetrics = await FixedAsset.findOne({
      where: { ...where, status: 'active' },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('total_cost')), 'totalCost'],
        [sequelize.fn('SUM', sequelize.col('accumulated_depreciation')), 'totalAccumulatedDepreciation'],
        [sequelize.fn('SUM', sequelize.col('book_value')), 'totalBookValue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'activeAssetCount'],
      ],
      raw: true,
    });

    // 3. Recent depreciations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentDepreciations = await AssetDepreciation.findOne({
      where: {
        companyId: user.companyId,
        depreciationDate: { [Op.gte]: thirtyDaysAgo },
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('depreciation_amount')), 'totalAmount'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      raw: true,
    });

    // 4. Maintenance statistics
    const today = new Date();
    const nextThirtyDays = new Date();
    nextThirtyDays.setDate(nextThirtyDays.getDate() + 30);

    const maintenanceStats = {
      overdue: await AssetMaintenance.count({
        where: {
          companyId: user.companyId,
          status: 'scheduled',
          maintenanceDate: { [Op.lt]: today },
        },
      }),
      upcoming: await AssetMaintenance.count({
        where: {
          companyId: user.companyId,
          status: 'scheduled',
          maintenanceDate: {
            [Op.and]: [{ [Op.gte]: today }, { [Op.lte]: nextThirtyDays }],
          },
        },
      }),
      inProgress: await AssetMaintenance.count({
        where: {
          companyId: user.companyId,
          status: 'in_progress',
        },
      }),
    };

    // 5. Assets requiring maintenance
    const assetsNeedingMaintenance = await FixedAsset.count({
      where: {
        companyId: user.companyId,
        status: 'active',
        nextMaintenanceDate: {
          [Op.and]: [{ [Op.gte]: today }, { [Op.lte]: nextThirtyDays }],
        },
      },
    });

    // 6. Assets by category (top 5)
    const assetsByCategory = await FixedAsset.findAll({
      where: { ...where, status: 'active' },
      attributes: [
        'assetCategoryId',
        [sequelize.fn('COUNT', sequelize.col('FixedAsset.id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('book_value')), 'totalValue'],
      ],
      include: [
        {
          association: 'category',
          attributes: ['categoryName'],
        },
      ],
      group: ['assetCategoryId', 'category.id'],
      order: [[sequelize.literal('COUNT("FixedAsset"."id")'), 'DESC']],
      limit: 5,
      raw: false,
    });

    // 7. Monthly depreciation trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyDepreciation = await AssetDepreciation.findAll({
      where: {
        companyId: user.companyId,
        depreciationDate: { [Op.gte]: sixMonthsAgo },
        status: 'posted',
      },
      attributes: [
        [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('depreciation_date')), 'month'],
        [sequelize.fn('SUM', sequelize.col('depreciation_amount')), 'totalAmount'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('depreciation_date'))],
      order: [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('depreciation_date')), 'ASC']],
      raw: true,
    });

    return NextResponse.json({
      success: true,
      stats: {
        assetCounts: {
          byStatus: assetCountsByStatus,
          total: assetCountsByStatus.reduce((sum: number, item: any) => sum + parseInt(item.count), 0),
        },
        assetValues: {
          totalCost: Number(assetValueMetrics?.totalCost || 0),
          totalAccumulatedDepreciation: Number(assetValueMetrics?.totalAccumulatedDepreciation || 0),
          totalBookValue: Number(assetValueMetrics?.totalBookValue || 0),
          activeAssetCount: parseInt(assetValueMetrics?.activeAssetCount || '0'),
        },
        depreciation: {
          last30Days: {
            totalAmount: Number(recentDepreciations?.totalAmount || 0),
            count: parseInt(recentDepreciations?.count || '0'),
          },
          monthlyTrend: monthlyDepreciation,
        },
        maintenance: {
          ...maintenanceStats,
          assetsNeedingMaintenance,
        },
        assetsByCategory,
      },
    });
  } catch (error) {
    logger.error('Error fetching FA dashboard stats', { error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
