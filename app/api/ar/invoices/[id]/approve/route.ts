import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Invoice } from '@/lib/db/models';
import { createValidationError, formatErrorResponse, createPermissionError } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';

// POST /api/ar/invoices/[id]/approve - Approve invoice
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
    if (!hasPermission(user, 'ar.invoices.approve')) {
      throw createPermissionError('Insufficient permissions to approve invoices');
    }

    const invoice = await Invoice.findOne({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!invoice) {
      throw createValidationError('Invoice not found', 'invoiceId');
    }

    if (invoice.status !== 'pending_approval' && invoice.status !== 'draft') {
      throw createValidationError('Only pending or draft invoices can be approved', 'status');
    }

    if (invoice.isPosted) {
      throw createValidationError('Invoice is already posted', 'isPosted');
    }

    if (invoice.isVoid) {
      throw createValidationError('Cannot approve voided invoice', 'isVoid');
    }

    // Update invoice to approved
    await invoice.update({
      status: 'approved',
      approvalStatus: 'approved',
      approvedBy: user.id,
      approvedAt: new Date(),
      rejectionReason: null,
      updatedBy: user.id,
    });

    logger.info('Invoice approved', {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      approvedBy: user.id,
    });

    return NextResponse.json({
      success: true,
      invoice,
      message: `Invoice ${invoice.invoiceNumber} approved successfully`,
    });
  } catch (error) {
    logger.error('Error approving invoice', { invoiceId: params.id, error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
