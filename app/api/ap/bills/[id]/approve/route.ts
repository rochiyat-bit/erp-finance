import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Bill } from '@/lib/db/models';
import { createValidationError, formatErrorResponse, createPermissionError } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';

// POST /api/ap/bills/[id]/approve - Approve bill
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
    if (!hasPermission(user, 'ap.bills.approve')) {
      throw createPermissionError('Insufficient permissions to approve bills');
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

    if (bill.status !== 'pending_approval' && bill.status !== 'draft') {
      throw createValidationError('Only pending or draft bills can be approved', 'status');
    }

    if (bill.isPosted) {
      throw createValidationError('Bill is already posted', 'isPosted');
    }

    // Update bill to approved
    await bill.update({
      status: 'approved',
      approvedBy: user.id,
      approvedAt: new Date(),
      rejectedBy: null,
      rejectedAt: null,
      rejectionReason: null,
      updatedBy: user.id,
    });

    logger.info('Bill approved', {
      billId: bill.id,
      billNumber: bill.billNumber,
      approvedBy: user.id,
    });

    return NextResponse.json({
      success: true,
      bill,
      message: `Bill ${bill.billNumber} approved successfully`,
    });
  } catch (error) {
    logger.error('Error approving bill', { billId: params.id, error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
