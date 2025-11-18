import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CustomerPayment, CustomerPaymentAllocation, Customer, Invoice } from '@/lib/db/models';
import { createPermissionError, createValidationError, formatErrorResponse } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';

// GET /api/ar/payments/[id] - Get payment details
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
    if (!hasPermission(user, 'ar.payments.view')) {
      throw createPermissionError('Insufficient permissions to view payments');
    }

    // Fetch payment with related data
    const payment = await CustomerPayment.findOne({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customerCode', 'customerName', 'email', 'phone'],
        },
        {
          model: CustomerPaymentAllocation,
          as: 'allocations',
          include: [
            {
              model: Invoice,
              as: 'invoice',
              attributes: ['id', 'invoiceNumber', 'invoiceDate', 'totalAmount', 'balanceAmount'],
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
    logger.error('Error fetching payment details', {
      paymentId: params.id,
      error,
    });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// DELETE /api/ar/payments/[id] - Delete payment
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
    if (!hasPermission(user, 'ar.payments.delete')) {
      throw createPermissionError('Insufficient permissions to delete payments');
    }

    // Fetch payment
    const payment = await CustomerPayment.findOne({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!payment) {
      throw createValidationError('Payment not found', 'paymentId');
    }

    // Validate payment can be deleted
    if (payment.isPosted) {
      throw createValidationError(
        'Cannot delete posted payment. Please void it instead.',
        'isPosted'
      );
    }

    if (payment.status !== 'draft') {
      throw createValidationError(
        'Only draft payments can be deleted',
        'status'
      );
    }

    // Delete payment (allocations will be cascade deleted)
    await payment.destroy();

    logger.info('Payment deleted', {
      paymentId: params.id,
      paymentNumber: payment.paymentNumber,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: `Payment ${payment.paymentNumber} deleted successfully`,
    });
  } catch (error) {
    logger.error('Error deleting payment', {
      paymentId: params.id,
      error,
    });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
