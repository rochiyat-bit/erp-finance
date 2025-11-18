import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AssetRevaluation, FixedAsset, AssetCategory, JournalEntry } from '@/lib/db/models';
import { createPermissionError, createValidationError, formatErrorResponse } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';

// GET /api/fa/asset-revaluations/:id
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

    if (!hasPermission(user, 'fa.revaluations.view')) {
      throw createPermissionError('Insufficient permissions to view asset revaluations');
    }

    const revaluation = await AssetRevaluation.findOne({
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
          model: JournalEntry,
          as: 'journalEntry',
        },
      ],
    });

    if (!revaluation) {
      throw createValidationError('Revaluation not found', 'revaluationId');
    }

    return NextResponse.json({
      success: true,
      revaluation,
    });
  } catch (error) {
    logger.error('Error fetching asset revaluation', { revaluationId: params.id, error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
