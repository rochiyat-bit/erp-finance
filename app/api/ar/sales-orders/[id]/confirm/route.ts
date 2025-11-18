import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SalesOrder } from '@/lib/db/models';
import { createPermissionError, createValidationError, formatErrorResponse } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';

// POST /api/ar/sales-orders/[id]/confirm - Confirm sales order
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
    if (!hasPermission(user, 'ar.sales_orders.confirm')) {
      throw createPermissionError('Insufficient permissions to confirm sales orders');
    }

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

    // Validate sales order can be confirmed
    if (salesOrder.status !== 'approved') {
      throw createValidationError(
        'Only approved sales orders can be confirmed',
        'status'
      );
    }

    if (salesOrder.isCancelled) {
      throw createValidationError('Cannot confirm cancelled sales order', 'isCancelled');
    }

    // Confirm sales order
    await salesOrder.update({
      status: 'confirmed',
      updatedBy: user.id,
    });

    logger.info('Sales order confirmed', {
      salesOrderId: salesOrder.id,
      soNumber: salesOrder.soNumber,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      salesOrder,
      message: `Sales order ${salesOrder.soNumber} confirmed successfully`,
    });
  } catch (error) {
    logger.error('Error confirming sales order', {
      salesOrderId: params.id,
      error,
    });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
