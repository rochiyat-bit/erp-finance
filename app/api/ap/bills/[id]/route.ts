import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Bill, BillLine, Vendor } from '@/lib/db/models';
import { createValidationError, formatErrorResponse, createPermissionError } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';

// GET /api/ap/bills/[id] - Get bill details
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
    if (!hasPermission(user, 'ap.bills.view')) {
      throw createPermissionError('Insufficient permissions to view bills');
    }

    const bill = await Bill.findOne({
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
          model: BillLine,
          as: 'lines',
        },
      ],
    });

    if (!bill) {
      throw createValidationError('Bill not found', 'billId');
    }

    return NextResponse.json({
      success: true,
      bill,
    });
  } catch (error) {
    logger.error('Error fetching bill', { billId: params.id, error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// PUT /api/ap/bills/[id] - Update bill (only if draft)
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
    if (!hasPermission(user, 'ap.bills.edit')) {
      throw createPermissionError('Insufficient permissions to edit bills');
    }

    const bill = await Bill.findOne({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!bill) {
      throw createValidationError('Bill not found', 'billId');
    }

    if (bill.status !== 'draft' && bill.status !== 'rejected') {
      throw createValidationError('Only draft or rejected bills can be edited', 'status');
    }

    // Parse request body
    const body = await req.json();

    // Update basic fields only (lines should be updated via separate endpoint)
    await bill.update({
      description: body.description !== undefined ? body.description : bill.description,
      notes: body.notes !== undefined ? body.notes : bill.notes,
      internalNotes: body.internalNotes !== undefined ? body.internalNotes : bill.internalNotes,
      tags: body.tags !== undefined ? body.tags : bill.tags,
      updatedBy: user.id,
    });

    logger.info('Bill updated', {
      billId: bill.id,
      billNumber: bill.billNumber,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      bill,
    });
  } catch (error) {
    logger.error('Error updating bill', { billId: params.id, error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// DELETE /api/ap/bills/[id] - Delete bill (only if draft)
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
    if (!hasPermission(user, 'ap.bills.delete')) {
      throw createPermissionError('Insufficient permissions to delete bills');
    }

    const bill = await Bill.findOne({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!bill) {
      throw createValidationError('Bill not found', 'billId');
    }

    if (bill.status !== 'draft') {
      throw createValidationError('Only draft bills can be deleted', 'status');
    }

    if (bill.isPosted) {
      throw createValidationError('Posted bills cannot be deleted', 'isPosted');
    }

    await bill.destroy();

    logger.info('Bill deleted', {
      billId: bill.id,
      billNumber: bill.billNumber,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Bill deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting bill', { billId: params.id, error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
