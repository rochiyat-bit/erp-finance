import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SalesOrder } from '@/lib/db/models';
import { createPermissionError, createValidationError, formatErrorResponse } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';

// POST /api/ar/sales-orders/[id]/approve - Approve sales order
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
    if (!hasPermission(user, 'ar.sales_orders.approve')) {
      throw createPermissionError('Insufficient permissions to approve sales orders');
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

    // Validate sales order can be approved
    if (salesOrder.status !== 'draft' && salesOrder.status !== 'pending_approval') {
      throw createValidationError(
        'Only draft or pending approval sales orders can be approved',
        'status'
      );
    }

    if (salesOrder.isCancelled) {
      throw createValidationError('Cannot approve cancelled sales order', 'isCancelled');
    }

    // Approve sales order
    await salesOrder.update({
      status: 'approved',
      approvedBy: user.id,
      approvedAt: new Date(),
      updatedBy: user.id,
    });

    logger.info('Sales order approved', {
      salesOrderId: salesOrder.id,
      soNumber: salesOrder.soNumber,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      salesOrder,
      message: `Sales order ${salesOrder.soNumber} approved successfully`,
    });
  } catch (error) {
    logger.error('Error approving sales order', {
      salesOrderId: params.id,
      error,
    });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
