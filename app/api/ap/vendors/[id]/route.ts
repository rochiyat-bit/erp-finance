import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Vendor } from '@/lib/db/models';
import { updateVendorSchema } from '@/lib/validators/ap';
import { createValidationError, formatErrorResponse, createPermissionError } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';

// GET /api/ap/vendors/[id] - Get vendor details
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
    if (!hasPermission(user, 'ap.vendors.view')) {
      throw createPermissionError('Insufficient permissions to view vendors');
    }

    const vendor = await Vendor.findOne({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!vendor) {
      throw createValidationError('Vendor not found', 'vendorId');
    }

    return NextResponse.json({
      success: true,
      vendor,
    });
  } catch (error) {
    logger.error('Error fetching vendor', { vendorId: params.id, error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// PUT /api/ap/vendors/[id] - Update vendor
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
    if (!hasPermission(user, 'ap.vendors.edit')) {
      throw createPermissionError('Insufficient permissions to edit vendors');
    }

    const vendor = await Vendor.findOne({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!vendor) {
      throw createValidationError('Vendor not found', 'vendorId');
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = updateVendorSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      throw createValidationError(firstError.message, firstError.path.join('.'));
    }

    const data = validation.data;

    // Update vendor
    await vendor.update({
      ...data,
      updatedBy: user.id,
    });

    logger.info('Vendor updated', {
      vendorId: vendor.id,
      vendorNumber: vendor.vendorNumber,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      vendor,
    });
  } catch (error) {
    logger.error('Error updating vendor', { vendorId: params.id, error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// DELETE /api/ap/vendors/[id] - Delete vendor
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
    if (!hasPermission(user, 'ap.vendors.delete')) {
      throw createPermissionError('Insufficient permissions to delete vendors');
    }

    const vendor = await Vendor.findOne({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!vendor) {
      throw createValidationError('Vendor not found', 'vendorId');
    }

    // Check if vendor has transactions
    if (Number(vendor.currentBalance) !== 0 || Number(vendor.ytdPurchases) !== 0) {
      throw createValidationError('Cannot delete vendor with transactions. Consider deactivating instead.', 'vendorId');
    }

    await vendor.destroy();

    logger.info('Vendor deleted', {
      vendorId: vendor.id,
      vendorNumber: vendor.vendorNumber,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Vendor deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting vendor', { vendorId: params.id, error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
