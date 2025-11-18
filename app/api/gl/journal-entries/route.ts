import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { JournalEntry, JournalEntryLine, ChartOfAccount, FiscalPeriod } from '@/lib/db/models';
import { createJournalEntrySchema, listJournalEntriesQuerySchema } from '@/lib/validators/gl';
import { createValidationError, formatErrorResponse, createPermissionError } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';
import { Op } from 'sequelize';
import sequelize from '@/lib/db/sequelize';

// GET /api/gl/journal-entries - List journal entries
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    // Check permission
    if (!hasPermission(user, 'gl.je.view')) {
      throw createPermissionError('Insufficient permissions to view journal entries');
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const query = listJournalEntriesQuerySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      status: searchParams.get('status'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      fiscalPeriodId: searchParams.get('fiscalPeriodId'),
      accountId: searchParams.get('accountId'),
      search: searchParams.get('search'),
      documentType: searchParams.get('documentType'),
    });

    // Build where clause
    const where: any = {
      companyId: user.companyId,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.startDate && query.endDate) {
      where.transactionDate = {
        [Op.between]: [new Date(query.startDate), new Date(query.endDate)],
      };
    }

    if (query.fiscalPeriodId) {
      where.fiscalPeriodId = query.fiscalPeriodId;
    }

    if (query.documentType) {
      where.documentType = query.documentType;
    }

    if (query.search) {
      where[Op.or] = [
        { journalNumber: { [Op.iLike]: `%${query.search}%` } },
        { description: { [Op.iLike]: `%${query.search}%` } },
        { referenceNumber: { [Op.iLike]: `%${query.search}%` } },
      ];
    }

    // Pagination
    const limit = query.limit;
    const offset = (query.page - 1) * limit;

    // Fetch journal entries with count
    const { count, rows: journalEntries } = await JournalEntry.findAndCountAll({
      where,
      include: [
        {
          model: JournalEntryLine,
          as: 'lines',
          attributes: ['id', 'lineNumber', 'accountCode', 'accountName', 'debitAmount', 'creditAmount'],
        },
      ],
      order: [['transactionDate', 'DESC'], ['createdAt', 'DESC']],
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      journalEntries,
      pagination: {
        page: query.page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    logger.error('Error listing journal entries', { error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// POST /api/gl/journal-entries - Create journal entry
export async function POST(req: NextRequest) {
  let transaction: any = null;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    // Check permission
    if (!hasPermission(user, 'gl.je.create')) {
      throw createPermissionError('Insufficient permissions to create journal entries');
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = createJournalEntrySchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      throw createValidationError(firstError.message, firstError.path.join('.'));
    }

    const data = validation.data;

    // Start transaction
    transaction = await sequelize.transaction();

    // Find fiscal period for transaction date
    const transactionDate = new Date(data.transactionDate);
    const fiscalPeriod = await FiscalPeriod.findOne({
      where: {
        companyId: user.companyId,
        startDate: { [Op.lte]: transactionDate },
        endDate: { [Op.gte]: transactionDate },
      },
      transaction,
    });

    if (!fiscalPeriod) {
      throw createValidationError('No fiscal period found for the transaction date');
    }

    if (fiscalPeriod.status !== 'open') {
      throw createValidationError('Cannot create journal entry in a closed fiscal period');
    }

    // Generate journal number
    const journalNumber = await generateJournalNumber(user.companyId, transaction);

    // Calculate totals
    const totalDebit = data.lines.reduce((sum, line) => sum + line.debitAmount, 0);
    const totalCredit = data.lines.reduce((sum, line) => sum + line.creditAmount, 0);

    // Create journal entry
    const journalEntry = await JournalEntry.create(
      {
        companyId: user.companyId,
        journalNumber,
        referenceNumber: data.referenceNumber,
        documentType: data.documentType,
        transactionDate,
        postingDate: transactionDate,
        description: data.description,
        notes: data.notes,
        fiscalYearId: fiscalPeriod.fiscalYearId,
        fiscalPeriodId: fiscalPeriod.id,
        currencyCode: data.currencyCode,
        exchangeRate: data.exchangeRate,
        status: 'draft',
        isPosted: false,
        requiresApproval: data.requiresApproval,
        isReversed: false,
        isRecurring: false,
        totalDebit,
        totalCredit,
        createdBy: user.id,
        updatedBy: user.id,
      },
      { transaction }
    );

    // Create journal entry lines
    const lines = [];
    for (let i = 0; i < data.lines.length; i++) {
      const lineData = data.lines[i];

      // Get account details
      const account = await ChartOfAccount.findByPk(lineData.accountId, { transaction });
      if (!account) {
        throw createValidationError(`Account not found: ${lineData.accountId}`);
      }

      if (!account.isActive) {
        throw createValidationError(`Account is inactive: ${account.code}`);
      }

      if (account.isHeader) {
        throw createValidationError(`Cannot post to header account: ${account.code}`);
      }

      const line = await JournalEntryLine.create(
        {
          companyId: user.companyId,
          journalEntryId: journalEntry.id,
          lineNumber: i + 1,
          description: lineData.description,
          accountId: account.id,
          accountCode: account.code,
          accountName: account.name,
          debitAmount: lineData.debitAmount,
          creditAmount: lineData.creditAmount,
          currencyCode: lineData.currencyCode || data.currencyCode,
          exchangeRate: lineData.exchangeRate || data.exchangeRate,
        },
        { transaction }
      );

      lines.push(line);
    }

    // If autoPost is true, post immediately
    if (data.autoPost) {
      await journalEntry.update(
        {
          status: 'approved',
        },
        { transaction }
      );
    }

    await transaction.commit();

    logger.info('Journal entry created', {
      journalEntryId: journalEntry.id,
      journalNumber: journalEntry.journalNumber,
      userId: user.id,
    });

    return NextResponse.json(
      {
        success: true,
        journalEntry,
        lines,
      },
      { status: 201 }
    );
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    logger.error('Error creating journal entry', { error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// Helper function to generate journal number
async function generateJournalNumber(companyId: string, transaction: any): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `JE-${year}-`;

  // Get the last journal number for this year
  const lastJE = await JournalEntry.findOne({
    where: {
      companyId,
      journalNumber: {
        [Op.like]: `${prefix}%`,
      },
    },
    order: [['createdAt', 'DESC']],
    transaction,
  });

  let nextNumber = 1;
  if (lastJE) {
    const lastNumberStr = lastJE.journalNumber.replace(prefix, '');
    const lastNumber = parseInt(lastNumberStr, 10);
    nextNumber = lastNumber + 1;
  }

  // Pad with zeros to 5 digits
  const paddedNumber = nextNumber.toString().padStart(5, '0');
  return `${prefix}${paddedNumber}`;
}
