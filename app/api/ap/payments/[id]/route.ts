import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BillPayment, PaymentAllocation, Vendor, Bill } from '@/lib/db/models';
import { createValidationError, formatErrorResponse, createPermissionError } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';

// GET /api/ap/payments/[id] - Get payment details
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

    // Check permission
    if (!hasPermission(user, 'ap.payments.view')) {
      throw createPermissionError('Insufficient permissions to view payments');
    }

    const payment = await BillPayment.findOne({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
      include: [
        {
          model: Vendor,
          as: 'vendor',
        },
        {
          model: PaymentAllocation,
          as: 'allocations',
          include: [
            {
              model: Bill,
              as: 'bill',
            },
          ],
        },
      ],
    });

    if (!payment) {
      throw createValidationError('Payment not found', 'paymentId');
    }

    return NextResponse.json({
      success: true,
      payment,
    });
  } catch (error) {
    logger.error('Error fetching payment', { paymentId: params.id, error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// DELETE /api/ap/payments/[id] - Delete payment (only if draft)
export async function DELETE(
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
    if (!hasPermission(user, 'ap.payments.delete')) {
      throw createPermissionError('Insufficient permissions to delete payments');
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

    if (payment.status !== 'draft') {
      throw createValidationError('Only draft payments can be deleted', 'status');
    }

    if (payment.isPosted) {
      throw createValidationError('Posted payments cannot be deleted', 'isPosted');
    }

    await payment.destroy();

    logger.info('Payment deleted', {
      paymentId: payment.id,
      paymentNumber: payment.paymentNumber,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting payment', { paymentId: params.id, error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
