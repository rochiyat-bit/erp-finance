import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FixedAsset, AssetCategory } from '@/lib/db/models';
import { createPermissionError, createValidationError, formatErrorResponse } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import { generateDepreciationSchedule } from '@/lib/fa/depreciation-calculator';
import logger from '@/lib/logger';

// GET /api/fa/reports/depreciation-schedule
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
    const assetId = searchParams.get('assetId');

    if (!assetId) {
      throw createValidationError('Asset ID is required', 'assetId');
    }

    // Verify asset exists and belongs to user's company
    const asset = await FixedAsset.findOne({
      where: {
        id: assetId,
        companyId: user.companyId,
      },
      include: [
        {
          model: AssetCategory,
          as: 'category',
          attributes: ['categoryCode', 'categoryName'],
        },
      ],
    });

    if (!asset) {
      throw createValidationError('Asset not found', 'assetId');
    }

    // Generate depreciation schedule
    const schedule = await generateDepreciationSchedule(assetId);

    // Calculate summary
    const summary = {
      assetName: asset.assetName,
      assetNumber: asset.assetNumber,
      category: asset.get('category'),
      acquisitionDate: asset.acquisitionDate,
      totalCost: Number(asset.totalCost),
      salvageValue: Number(asset.salvageValue),
      depreciableAmount: Number(asset.totalCost) - Number(asset.salvageValue),
      depreciationMethod: asset.depreciationMethod,
      usefulLifeMonths: asset.usefulLifeMonths,
      totalPeriods: schedule.length,
      totalDepreciation: schedule.reduce((sum, period) => sum + period.depreciationAmount, 0),
    };

    return NextResponse.json({
      success: true,
      report: {
        title: 'Depreciation Schedule',
        generatedAt: new Date(),
        asset: summary,
        schedule,
      },
    });
  } catch (error) {
    logger.error('Error generating depreciation schedule report', { error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
