import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { postBill } from '@/lib/ap/posting-engine';
import { formatErrorResponse, createPermissionError } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';

// POST /api/ap/bills/[id]/post - Post bill to general ledger
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
    if (!hasPermission(user, 'ap.bills.post')) {
      throw createPermissionError('Insufficient permissions to post bills');
    }

    const billId = params.id;

    // Post the bill
    const result = await postBill(billId, user.id);

    logger.info('Bill posted via API', {
      billId,
      billNumber: result.bill.billNumber,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      bill: result.bill,
      journalEntry: result.journalEntry,
      generalLedgerEntries: result.generalLedgerEntries,
      message: result.message,
    });
  } catch (error) {
    logger.error('Error posting bill via API', {
      billId: params.id,
      error,
    });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
