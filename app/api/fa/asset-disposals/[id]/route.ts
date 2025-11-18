import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AssetDisposal, FixedAsset, AssetCategory, JournalEntry } from '@/lib/db/models';
import { createPermissionError, createValidationError, formatErrorResponse } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';

// GET /api/fa/asset-disposals/:id
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

    if (!hasPermission(user, 'fa.disposals.view')) {
      throw createPermissionError('Insufficient permissions to view asset disposals');
    }

    const disposal = await AssetDisposal.findOne({
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

    if (!disposal) {
      throw createValidationError('Disposal not found', 'disposalId');
    }

    return NextResponse.json({
      success: true,
      disposal,
    });
  } catch (error) {
    logger.error('Error fetching asset disposal', { disposalId: params.id, error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
