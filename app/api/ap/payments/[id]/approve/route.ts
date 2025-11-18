import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BillPayment } from '@/lib/db/models';
import { createValidationError, formatErrorResponse, createPermissionError } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';

// POST /api/ap/payments/[id]/approve - Approve payment
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
    if (!hasPermission(user, 'ap.payments.approve')) {
      throw createPermissionError('Insufficient permissions to approve payments');
    }

    const payment = await BillPayment.findOne({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!payment) {
      throw createValidationError('Payment not found', 'paymentId');
    }

    if (payment.status !== 'pending' && payment.status !== 'draft') {
      throw createValidationError('Only pending or draft payments can be approved', 'status');
    }

    if (payment.isPosted) {
      throw createValidationError('Payment is already posted', 'isPosted');
    }

    // Update payment to approved
    await payment.update({
      status: 'approved',
      approvedBy: user.id,
      approvedAt: new Date(),
      updatedBy: user.id,
    });

    logger.info('Payment approved', {
      paymentId: payment.id,
      paymentNumber: payment.paymentNumber,
      approvedBy: user.id,
    });

    return NextResponse.json({
      success: true,
      payment,
      message: `Payment ${payment.paymentNumber} approved successfully`,
    });
  } catch (error) {
    logger.error('Error approving payment', { paymentId: params.id, error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
