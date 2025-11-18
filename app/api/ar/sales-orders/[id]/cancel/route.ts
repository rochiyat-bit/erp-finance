import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SalesOrder } from '@/lib/db/models';
import { createPermissionError, createValidationError, formatErrorResponse } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';

// POST /api/ar/sales-orders/[id]/cancel - Cancel sales order
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
    if (!hasPermission(user, 'ar.sales_orders.cancel')) {
      throw createPermissionError('Insufficient permissions to cancel sales orders');
    }

    // Parse request body for cancellation reason
    const body = await req.json();
    const cancellationReason = body.cancellationReason || 'No reason provided';

    // Fetch sales order
    const salesOrder = await SalesOrder.findOne({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!salesOrder) {
      throw createValidationError('Sales order not found', 'salesOrderId');
    }

    // Validate sales order can be cancelled
    if (salesOrder.isCancelled) {
      throw createValidationError('Sales order is already cancelled', 'isCancelled');
    }

    if (salesOrder.isClosed) {
      throw createValidationError('Cannot cancel closed sales order', 'isClosed');
    }

    if (salesOrder.deliveredQuantity > 0) {
      throw createValidationError(
        'Cannot cancel sales order with deliveries',
        'deliveredQuantity'
      );
    }

    if (salesOrder.invoicedQuantity > 0) {
      throw createValidationError(
        'Cannot cancel sales order with invoices',
        'invoicedQuantity'
      );
    }

    // Cancel sales order
    await salesOrder.update({
      status: 'cancelled',
      isCancelled: true,
      cancelledBy: user.id,
      cancelledAt: new Date(),
      cancellationReason,
      updatedBy: user.id,
    });

    logger.info('Sales order cancelled', {
      salesOrderId: salesOrder.id,
      soNumber: salesOrder.soNumber,
      cancellationReason,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      salesOrder,
      message: `Sales order ${salesOrder.soNumber} cancelled successfully`,
    });
  } catch (error) {
    logger.error('Error cancelling sales order', {
      salesOrderId: params.id,
      error,
    });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
