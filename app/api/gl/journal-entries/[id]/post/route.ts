import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { postJournalEntry } from '@/lib/gl/posting-engine';
import { formatErrorResponse, createPermissionError } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';

// POST /api/gl/journal-entries/[id]/post - Post journal entry to general ledger
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
    if (!hasPermission(user, 'gl.je.post')) {
      throw createPermissionError('Insufficient permissions to post journal entries');
    }

    const journalEntryId = params.id;

    // Post the journal entry
    const result = await postJournalEntry(journalEntryId, user.id);

    logger.info('Journal entry posted via API', {
      journalEntryId,
      journalNumber: result.journalEntry.journalNumber,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      journalEntry: result.journalEntry,
      generalLedgerEntries: result.generalLedgerEntries,
      message: result.message,
    });
  } catch (error) {
    logger.error('Error posting journal entry via API', {
      journalEntryId: params.id,
      error,
    });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
