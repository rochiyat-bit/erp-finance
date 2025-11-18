import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AssetDisposal } from '@/lib/db/models';
import { createPermissionError, createValidationError, formatErrorResponse } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import { postDisposalToGL } from '@/lib/fa/gl-integration';
import logger from '@/lib/logger';

// POST /api/fa/asset-disposals/:id/post
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

    if (!hasPermission(user, 'fa.disposals.post')) {
      throw createPermissionError('Insufficient permissions to post asset disposals');
    }

    const disposal = await AssetDisposal.findOne({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!disposal) {
      throw createValidationError('Disposal not found', 'disposalId');
    }

    if (disposal.isPosted) {
      throw createValidationError(
        'Disposal is already posted',
        'status'
      );
    }

    const result = await postDisposalToGL(
      disposal.id,
      user.id
    );

    logger.info('Asset disposal posted to GL', {
      disposalId: disposal.id,
      journalEntryId: result.journalEntry.id,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      journalEntry: result.journalEntry,
      disposal: result.disposal,
    });
  } catch (error) {
    logger.error('Error posting asset disposal', { disposalId: params.id, error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
