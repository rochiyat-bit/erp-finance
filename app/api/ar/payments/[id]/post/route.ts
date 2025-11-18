import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { postCustomerPayment } from '@/lib/ar/posting-engine';
import { formatErrorResponse, createPermissionError } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';

// POST /api/ar/payments/[id]/post - Post payment to GL
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

    // Check permission
    if (!hasPermission(user, 'ar.payments.post')) {
      throw createPermissionError('Insufficient permissions to post payments');
    }

    // Post payment using posting engine
    const result = await postCustomerPayment(params.id, user.id);

    logger.info('Payment posted via API', {
      paymentId: params.id,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      payment: result.payment,
      journalEntry: result.journalEntry,
      generalLedgerEntries: result.generalLedgerEntries,
      message: result.message,
    });
  } catch (error) {
    logger.error('Error posting payment via API', {
      paymentId: params.id,
      error,
    });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
