import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { postDepreciationSchema } from '@/lib/validators/fa';
import { createPermissionError, createValidationError, formatErrorResponse } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import { postDepreciationToGL } from '@/lib/fa/gl-integration';
import logger from '@/lib/logger';

// POST /api/fa/depreciations/batch-post
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    if (!hasPermission(user, 'fa.depreciations.post')) {
      throw createPermissionError('Insufficient permissions to post depreciations');
    }

    const body = await req.json();
    const validation = postDepreciationSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      throw createValidationError(firstError.message, firstError.path.join('.'));
    }

    const { depreciationIds, postingDate } = validation.data;

    const result = await postDepreciationToGL(
      depreciationIds,
      new Date(postingDate),
      user.id
    );

    logger.info('Depreciation posted to GL', {
      depreciationIds,
      journalEntryId: result.journalEntry.id,
      totalAmount: result.totalAmount,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully posted ${result.depreciationsPosted} depreciations to GL`,
      journalEntry: result.journalEntry,
      summary: {
        depreciationsPosted: result.depreciationsPosted,
        totalAmount: result.totalAmount,
      },
    });
  } catch (error) {
    logger.error('Error posting depreciation to GL', { error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
