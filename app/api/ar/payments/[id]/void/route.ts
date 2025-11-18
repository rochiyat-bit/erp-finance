import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CustomerPayment, CustomerPaymentAllocation, Invoice, Customer } from '@/lib/db/models';
import { createPermissionError, createValidationError, formatErrorResponse } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';
import sequelize from '@/lib/db/sequelize';

// POST /api/ar/payments/[id]/void - Void a posted payment
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let transaction: any = null;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    // Check permission
    if (!hasPermission(user, 'ar.payments.void')) {
      throw createPermissionError('Insufficient permissions to void payments');
    }

    // Parse request body for void reason
    const body = await req.json();
    const voidReason = body.voidReason || 'No reason provided';

    // Start transaction
    transaction = await sequelize.transaction();

    // Fetch payment with allocations
    const payment = await CustomerPayment.findOne({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
      include: [
        {
          model: CustomerPaymentAllocation,
          as: 'allocations',
          include: [
            {
              model: Invoice,
              as: 'invoice',
            },
          ],
        },
        {
          model: Customer,
          as: 'customer',
        },
      ],
      transaction,
    });

    if (!payment) {
      throw createValidationError('Payment not found', 'paymentId');
    }

    if (payment.isVoid) {
      throw createValidationError('Payment is already voided', 'isVoid');
    }

    if (!payment.isPosted) {
      throw createValidationError(
        'Only posted payments can be voided. Delete draft payments instead.',
        'isPosted'
      );
    }

    const customer = payment.get('customer') as Customer;
    const allocations = payment.get('allocations') as CustomerPaymentAllocation[];

    // Reverse invoice balances
    if (allocations && allocations.length > 0) {
      for (const allocation of allocations) {
        const invoice = allocation.get('invoice') as Invoice;
        const totalApplied = Number(allocation.allocatedAmount) + Number(allocation.discountGiven);

        // Restore invoice balance
        const newPaidAmount = Number(invoice.paidAmount) - totalApplied;
        const newBalance = Number(invoice.totalAmount) - newPaidAmount;

        let newPaymentStatus = invoice.paymentStatus;
        if (newBalance >= Number(invoice.totalAmount) - 0.01) {
          newPaymentStatus = 'unpaid';
        } else if (newPaidAmount > 0) {
          newPaymentStatus = 'partial';
        }

        await invoice.update(
          {
            paidAmount: newPaidAmount,
            balanceAmount: newBalance,
            paymentStatus: newPaymentStatus,
          },
          { transaction }
        );
      }
    }

    // Restore customer balance
    await customer.update(
      {
        currentBalance: Number(customer.currentBalance) + Number(payment.paymentAmount),
        totalCollected: Number(customer.totalCollected) - Number(payment.paymentAmount),
      },
      { transaction }
    );

    // Void the payment
    await payment.update(
      {
        isVoid: true,
        voidedAt: new Date(),
        voidedBy: user.id,
        voidReason,
        status: 'voided',
        updatedBy: user.id,
      },
      { transaction }
    );

    await transaction.commit();

    logger.info('Payment voided', {
      paymentId: payment.id,
      paymentNumber: payment.paymentNumber,
      voidReason,
      userId: user.id,
    });

    // Fetch updated payment
    const updatedPayment = await CustomerPayment.findByPk(params.id, {
      include: [
        {
          model: Customer,
          as: 'customer',
        },
        {
          model: CustomerPaymentAllocation,
          as: 'allocations',
        },
      ],
    });

    return NextResponse.json({
      success: true,
      payment: updatedPayment,
      message: `Payment ${payment.paymentNumber} voided successfully`,
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    logger.error('Error voiding payment', {
      paymentId: params.id,
      error,
    });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
