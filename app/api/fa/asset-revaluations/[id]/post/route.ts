import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AssetRevaluation } from '@/lib/db/models';
import { createPermissionError, createValidationError, formatErrorResponse } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import { postRevaluationToGL } from '@/lib/fa/gl-integration';
import logger from '@/lib/logger';

// POST /api/fa/asset-revaluations/:id/post
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    if (!hasPermission(user, 'fa.revaluations.post')) {
      throw createPermissionError('Insufficient permissions to post asset revaluations');
    }

    const revaluation = await AssetRevaluation.findOne({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!revaluation) {
      throw createValidationError('Revaluation not found', 'revaluationId');
    }

    if (revaluation.isPosted) {
      throw createValidationError(
        'Revaluation is already posted',
        'status'
      );
    }

    const result = await postRevaluationToGL(
      revaluation.id,
      user.id
    );

    logger.info('Asset revaluation posted to GL', {
      revaluationId: revaluation.id,
      journalEntryId: result.journalEntry.id,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      journalEntry: result.journalEntry,
      revaluation: result.revaluation,
    });
  } catch (error) {
    logger.error('Error posting asset revaluation', { revaluationId: params.id, error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
