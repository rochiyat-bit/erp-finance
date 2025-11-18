import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SalesOrder, SalesOrderLine, Customer } from '@/lib/db/models';
import { createPermissionError, createValidationError, formatErrorResponse } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';

// GET /api/ar/sales-orders/[id] - Get sales order details
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
    if (!hasPermission(user, 'ar.sales_orders.view')) {
      throw createPermissionError('Insufficient permissions to view sales orders');
    }

    // Fetch sales order with related data
    const salesOrder = await SalesOrder.findOne({
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
          model: SalesOrderLine,
          as: 'lines',
        },
      ],
    });

    if (!salesOrder) {
      throw createValidationError('Sales order not found', 'salesOrderId');
    }

    return NextResponse.json({
      success: true,
      salesOrder,
    });
  } catch (error) {
    logger.error('Error fetching sales order details', {
      salesOrderId: params.id,
      error,
    });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// PUT /api/ar/sales-orders/[id] - Update sales order
export async function PUT(
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
    if (!hasPermission(user, 'ar.sales_orders.edit')) {
      throw createPermissionError('Insufficient permissions to edit sales orders');
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

    // Validate sales order can be edited
    if (salesOrder.status !== 'draft' && salesOrder.status !== 'pending_approval') {
      throw createValidationError(
        'Only draft or pending approval sales orders can be edited',
        'status'
      );
    }

    if (salesOrder.isCancelled) {
      throw createValidationError('Cannot edit cancelled sales order', 'isCancelled');
    }

    // Parse request body
    const body = await req.json();

    // Update allowed fields
    const allowedUpdates: any = {
      updatedBy: user.id,
    };

    if (body.customerPO !== undefined) allowedUpdates.customerPO = body.customerPO;
    if (body.requiredDate !== undefined)
      allowedUpdates.requiredDate = body.requiredDate ? new Date(body.requiredDate) : null;
    if (body.promisedDate !== undefined)
      allowedUpdates.promisedDate = body.promisedDate ? new Date(body.promisedDate) : null;
    if (body.shippingMethodId !== undefined) allowedUpdates.shippingMethodId = body.shippingMethodId;
    if (body.shippingAddress !== undefined) allowedUpdates.shippingAddress = body.shippingAddress;
    if (body.billingAddress !== undefined) allowedUpdates.billingAddress = body.billingAddress;
    if (body.description !== undefined) allowedUpdates.description = body.description;
    if (body.notes !== undefined) allowedUpdates.notes = body.notes;
    if (body.internalNotes !== undefined) allowedUpdates.internalNotes = body.internalNotes;

    await salesOrder.update(allowedUpdates);

    logger.info('Sales order updated', {
      salesOrderId: salesOrder.id,
      soNumber: salesOrder.soNumber,
      userId: user.id,
    });

    // Fetch updated sales order
    const updatedSalesOrder = await SalesOrder.findByPk(params.id, {
      include: [
        {
          model: Customer,
          as: 'customer',
        },
        {
          model: SalesOrderLine,
          as: 'lines',
        },
      ],
    });

    return NextResponse.json({
      success: true,
      salesOrder: updatedSalesOrder,
    });
  } catch (error) {
    logger.error('Error updating sales order', {
      salesOrderId: params.id,
      error,
    });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// DELETE /api/ar/sales-orders/[id] - Delete sales order
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
    if (!hasPermission(user, 'ar.sales_orders.delete')) {
      throw createPermissionError('Insufficient permissions to delete sales orders');
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

    // Validate sales order can be deleted
    if (salesOrder.status !== 'draft') {
      throw createValidationError(
        'Only draft sales orders can be deleted. Cancel approved sales orders instead.',
        'status'
      );
    }

    if (salesOrder.deliveredQuantity > 0) {
      throw createValidationError(
        'Cannot delete sales order with deliveries',
        'deliveredQuantity'
      );
    }

    if (salesOrder.invoicedQuantity > 0) {
      throw createValidationError(
        'Cannot delete sales order with invoices',
        'invoicedQuantity'
      );
    }

    // Delete sales order (lines will be cascade deleted)
    await salesOrder.destroy();

    logger.info('Sales order deleted', {
      salesOrderId: params.id,
      soNumber: salesOrder.soNumber,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: `Sales order ${salesOrder.soNumber} deleted successfully`,
    });
  } catch (error) {
    logger.error('Error deleting sales order', {
      salesOrderId: params.id,
      error,
    });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
