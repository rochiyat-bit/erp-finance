import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { calculateDepreciationSchema } from '@/lib/validators/fa';
import { createPermissionError, createValidationError, formatErrorResponse } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import { batchCalculateDepreciation } from '@/lib/fa/depreciation-calculator';
import logger from '@/lib/logger';

// POST /api/fa/depreciations/calculate
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    if (!hasPermission(user, 'fa.depreciations.calculate')) {
      throw createPermissionError('Insufficient permissions to calculate depreciations');
    }

    const body = await req.json();
    const validation = calculateDepreciationSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      throw createValidationError(firstError.message, firstError.path.join('.'));
    }

    const { fiscalPeriodId, assetIds, depreciationDate } = validation.data;

    const result = await batchCalculateDepreciation(
      fiscalPeriodId,
      assetIds || null,
      new Date(depreciationDate),
      user.id,
      user.companyId
    );

    logger.info('Depreciation calculated', {
      fiscalPeriodId,
      assetIds,
      depreciationsCalculated: result.depreciationsCalculated,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully calculated depreciation for ${result.depreciationsCalculated} assets`,
      summary: {
        depreciationsCalculated: result.depreciationsCalculated,
        totalDepreciationAmount: result.totalDepreciationAmount,
        errors: result.errors,
      },
      depreciations: result.depreciations,
    });
  } catch (error) {
    logger.error('Error calculating depreciation', { error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
