import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AssetDepreciation } from '@/lib/db/models';
import { reverseDepreciationSchema } from '@/lib/validators/fa';
import { createPermissionError, createValidationError, formatErrorResponse } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import { reverseDepreciation } from '@/lib/fa/gl-integration';
import logger from '@/lib/logger';

// POST /api/fa/depreciations/:id/reverse
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

    if (!hasPermission(user, 'fa.depreciations.reverse')) {
      throw createPermissionError('Insufficient permissions to reverse depreciations');
    }

    const depreciation = await AssetDepreciation.findOne({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!depreciation) {
      throw createValidationError('Depreciation not found', 'depreciationId');
    }

    if (depreciation.status !== 'posted') {
      throw createValidationError(
        'Only posted depreciations can be reversed',
        'status'
      );
    }

    const body = await req.json();
    const validation = reverseDepreciationSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      throw createValidationError(firstError.message, firstError.path.join('.'));
    }

    const { reason } = validation.data;

    const result = await reverseDepreciation(
      depreciation.id,
      reason,
      user.id
    );

    logger.info('Depreciation reversed', {
      depreciationId: depreciation.id,
      reversalJournalEntryId: result.reversalJournalEntry.id,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Depreciation reversed successfully',
      reversalJournalEntry: result.reversalJournalEntry,
    });
  } catch (error) {
    logger.error('Error reversing depreciation', { depreciationId: params.id, error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
