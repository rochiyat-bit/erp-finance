import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Customer } from '@/lib/db/models';
import { updateCustomerSchema } from '@/lib/validators/ar';
import { createValidationError, formatErrorResponse, createPermissionError } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';

// GET /api/ar/customers/[id] - Get customer details
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
    if (!hasPermission(user, 'ar.customers.view')) {
      throw createPermissionError('Insufficient permissions to view customers');
    }

    const customer = await Customer.findOne({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!customer) {
      throw createValidationError('Customer not found', 'customerId');
    }

    return NextResponse.json({
      success: true,
      customer,
    });
  } catch (error) {
    logger.error('Error fetching customer', { customerId: params.id, error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// PUT /api/ar/customers/[id] - Update customer
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
    if (!hasPermission(user, 'ar.customers.edit')) {
      throw createPermissionError('Insufficient permissions to edit customers');
    }

    const customer = await Customer.findOne({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!customer) {
      throw createValidationError('Customer not found', 'customerId');
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = updateCustomerSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      throw createValidationError(firstError.message, firstError.path.join('.'));
    }

    const data = validation.data;

    // Update customer
    await customer.update({
      ...data,
      updatedBy: user.id,
    });

    logger.info('Customer updated', {
      customerId: customer.id,
      customerCode: customer.customerCode,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      customer,
    });
  } catch (error) {
    logger.error('Error updating customer', { customerId: params.id, error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// DELETE /api/ar/customers/[id] - Delete customer
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
    if (!hasPermission(user, 'ar.customers.delete')) {
      throw createPermissionError('Insufficient permissions to delete customers');
    }

    const customer = await Customer.findOne({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!customer) {
      throw createValidationError('Customer not found', 'customerId');
    }

    // Check if customer has transactions
    if (Number(customer.currentBalance) !== 0 || Number(customer.totalSales) !== 0) {
      throw createValidationError('Cannot delete customer with transactions. Consider deactivating instead.', 'customerId');
    }

    await customer.destroy();

    logger.info('Customer deleted', {
      customerId: customer.id,
      customerCode: customer.customerCode,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting customer', { customerId: params.id, error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
