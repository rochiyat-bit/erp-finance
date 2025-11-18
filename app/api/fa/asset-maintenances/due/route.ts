import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FixedAsset, AssetCategory, AssetLocation } from '@/lib/db/models';
import { createPermissionError, formatErrorResponse } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';
import { Op } from 'sequelize';

// GET /api/fa/asset-maintenances/due
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
    const daysAhead = parseInt(searchParams.get('daysAhead') || '30');

    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    // Find assets with next maintenance date within the range
    const assets = await FixedAsset.findAll({
      where: {
        companyId: user.companyId,
        status: 'active',
        nextMaintenanceDate: {
          [Op.and]: [
            { [Op.gte]: today },
            { [Op.lte]: futureDate },
          ],
        },
      },
      include: [
        {
          model: AssetCategory,
          as: 'category',
        },
        {
          model: AssetLocation,
          as: 'location',
        },
      ],
      order: [['nextMaintenanceDate', 'ASC']],
    });

    // Also find assets that are overdue
    const overdueAssets = await FixedAsset.findAll({
      where: {
        companyId: user.companyId,
        status: 'active',
        nextMaintenanceDate: {
          [Op.lt]: today,
        },
      },
      include: [
        {
          model: AssetCategory,
          as: 'category',
        },
        {
          model: AssetLocation,
          as: 'location',
        },
      ],
      order: [['nextMaintenanceDate', 'ASC']],
    });

    return NextResponse.json({
      success: true,
      summary: {
        dueCount: assets.length,
        overdueCount: overdueAssets.length,
        totalCount: assets.length + overdueAssets.length,
      },
      dueMaintenances: assets,
      overdueMaintenances: overdueAssets,
    });
  } catch (error) {
    logger.error('Error fetching due maintenances', { error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
