import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { postInvoice } from '@/lib/ar/posting-engine';
import { formatErrorResponse, createPermissionError } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';

// POST /api/ar/invoices/[id]/post - Post invoice to general ledger
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
    if (!hasPermission(user, 'ar.invoices.post')) {
      throw createPermissionError('Insufficient permissions to post invoices');
    }

    const invoiceId = params.id;

    // Post the invoice
    const result = await postInvoice(invoiceId, user.id);

    logger.info('Invoice posted via API', {
      invoiceId,
      invoiceNumber: result.invoice.invoiceNumber,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      invoice: result.invoice,
      journalEntry: result.journalEntry,
      generalLedgerEntries: result.generalLedgerEntries,
      message: result.message,
    });
  } catch (error) {
    logger.error('Error posting invoice via API', {
      invoiceId: params.id,
      error,
    });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
