import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AssetDepreciation, FixedAsset, AssetCategory, FiscalPeriod, JournalEntry } from '@/lib/db/models';
import { createPermissionError, createValidationError, formatErrorResponse } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';

// GET /api/fa/depreciations/:id
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    if (!hasPermission(user, 'fa.depreciations.view')) {
      throw createPermissionError('Insufficient permissions to view depreciations');
    }

    const depreciation = await AssetDepreciation.findOne({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
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
        {
          model: JournalEntry,
          as: 'journalEntry',
        },
      ],
    });

    if (!depreciation) {
      throw createValidationError('Depreciation not found', 'depreciationId');
    }

    return NextResponse.json({
      success: true,
      depreciation,
    });
  } catch (error) {
    logger.error('Error fetching depreciation', { depreciationId: params.id, error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
