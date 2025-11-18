import { Transaction } from 'sequelize';
import sequelize from '../db/sequelize';
import {
  JournalEntry,
  JournalEntryLine,
  GeneralLedger,
  AccountBalance,
  ChartOfAccount,
  FiscalPeriod,
} from '../db/models';
import { createValidationError, createDatabaseError } from '../error-handler';
import logger from '../logger';

interface PostingResult {
  success: boolean;
  journalEntry: JournalEntry;
  generalLedgerEntries: GeneralLedger[];
  message?: string;
}

/**
 * Post a journal entry to the general ledger
 * This is a critical operation that must maintain data integrity
 */
export async function postJournalEntry(
  journalEntryId: string,
  userId: string
): Promise<PostingResult> {
  let transaction: Transaction | null = null;

  try {
    // Start database transaction
    transaction = await sequelize.transaction();

    // 1. Get journal entry with lines
    const journalEntry = await JournalEntry.findByPk(journalEntryId, {
      include: [
        {
          model: JournalEntryLine,
          as: 'lines',
        },
      ],
      transaction,
    });

    if (!journalEntry) {
      throw createValidationError('Journal entry not found');
    }

    // 2. Validate posting rules
    await validatePostingRules(journalEntry, transaction);

    // 3. Get fiscal period and check if open
    const fiscalPeriod = await FiscalPeriod.findByPk(journalEntry.fiscalPeriodId, {
      transaction,
    });

    if (!fiscalPeriod || fiscalPeriod.status !== 'open') {
      throw createValidationError('Cannot post to a closed fiscal period');
    }

    // 4. Create general ledger entries
    const glEntries: GeneralLedger[] = [];
    const lines = (journalEntry as any).lines || [];

    for (const line of lines) {
      // Get account details
      const account = await ChartOfAccount.findByPk(line.accountId, { transaction });
      if (!account) {
        throw createValidationError(`Account not found: ${line.accountCode}`);
      }

      // Create GL entry
      const glEntry = await GeneralLedger.create(
        {
          companyId: journalEntry.companyId,
          journalEntryId: journalEntry.id,
          journalEntryLineId: line.id,
          accountId: line.accountId,
          accountCode: line.accountCode,
          accountName: line.accountName,
          accountType: account.accountType,
          transactionDate: journalEntry.transactionDate,
          postingDate: new Date(),
          description: line.description || journalEntry.description,
          debitAmount: line.debitAmount,
          creditAmount: line.creditAmount,
          balanceAmount: 0, // Will be calculated
          currencyCode: line.currencyCode,
          exchangeRate: line.exchangeRate,
          debitAmountFC: line.debitAmountFC,
          creditAmountFC: line.creditAmountFC,
          fiscalYearId: journalEntry.fiscalYearId,
          fiscalPeriodId: journalEntry.fiscalPeriodId,
          referenceNumber: journalEntry.referenceNumber,
          sourceModule: journalEntry.sourceModule,
          sourceDocumentType: journalEntry.sourceDocumentType,
          sourceDocumentId: journalEntry.sourceDocumentId,
          isReversed: false,
          postedBy: userId,
        },
        { transaction }
      );

      glEntries.push(glEntry);
    }

    // 5. Update account balances
    const affectedAccounts = [...new Set(lines.map((l: any) => l.accountId))];
    for (const accountId of affectedAccounts) {
      await updateAccountBalance(accountId, journalEntry.fiscalPeriodId, transaction);
    }

    // 6. Update journal entry status
    await journalEntry.update(
      {
        status: 'posted',
        isPosted: true,
        postedAt: new Date(),
        postedBy: userId,
      },
      { transaction }
    );

    // 7. Commit transaction
    await transaction.commit();

    logger.info('Journal entry posted successfully', {
      journalEntryId,
      journalNumber: journalEntry.journalNumber,
      userId,
    });

    return {
      success: true,
      journalEntry,
      generalLedgerEntries: glEntries,
      message: 'Journal entry posted successfully',
    };
  } catch (error) {
    // Rollback transaction on error
    if (transaction) {
      await transaction.rollback();
    }

    logger.error('Failed to post journal entry', {
      journalEntryId,
      error,
    });

    throw error;
  }
}

/**
 * Validate posting rules
 */
async function validatePostingRules(
  journalEntry: JournalEntry,
  transaction: Transaction
): Promise<void> {
  // Check if already posted
  if (journalEntry.isPosted) {
    throw createValidationError('Journal entry is already posted');
  }

  // Check if reversed
  if (journalEntry.isReversed) {
    throw createValidationError('Cannot post a reversed journal entry');
  }

  // Check approval status
  if (journalEntry.requiresApproval && journalEntry.approvalStatus !== 'approved') {
    throw createValidationError('Journal entry must be approved before posting');
  }

  // Check if status allows posting
  if (!['draft', 'approved'].includes(journalEntry.status)) {
    throw createValidationError(`Cannot post journal entry with status: ${journalEntry.status}`);
  }

  // Validate balances
  const difference = Math.abs(journalEntry.totalDebit - journalEntry.totalCredit);
  if (difference >= 0.01) {
    throw createValidationError('Total debits must equal total credits');
  }

  // Get lines
  const lines = (journalEntry as any).lines || [];
  if (lines.length < 2) {
    throw createValidationError('Journal entry must have at least 2 lines');
  }

  // Validate each line
  for (const line of lines) {
    const account = await ChartOfAccount.findByPk(line.accountId, { transaction });

    if (!account) {
      throw createValidationError(`Account not found: ${line.accountCode}`);
    }

    if (!account.isActive) {
      throw createValidationError(`Cannot post to inactive account: ${account.code}`);
    }

    if (account.isHeader) {
      throw createValidationError(`Cannot post to header account: ${account.code}`);
    }

    if (!account.allowManualEntry && journalEntry.documentType === 'manual') {
      throw createValidationError(
        `Manual entries not allowed for account: ${account.code}`
      );
    }

    // Check that line has either debit or credit (not both)
    if ((line.debitAmount > 0 && line.creditAmount > 0) ||
        (line.debitAmount === 0 && line.creditAmount === 0)) {
      throw createValidationError(
        'Each line must have either a debit OR credit amount (not both or neither)'
      );
    }
  }
}

/**
 * Update account balance after posting
 */
async function updateAccountBalance(
  accountId: string,
  fiscalPeriodId: string,
  transaction: Transaction
): Promise<void> {
  // Get account
  const account = await ChartOfAccount.findByPk(accountId, { transaction });
  if (!account) {
    throw createValidationError('Account not found');
  }

  // Get fiscal period
  const period = await FiscalPeriod.findByPk(fiscalPeriodId, { transaction });
  if (!period) {
    throw createValidationError('Fiscal period not found');
  }

  // Calculate opening balance (from previous period or account opening balance)
  const previousPeriods = await FiscalPeriod.findAll({
    where: {
      companyId: account.companyId,
      fiscalYearId: period.fiscalYearId,
      periodNumber: period.periodNumber - 1,
    },
    transaction,
  });

  let openingBalance = 0;
  if (previousPeriods.length > 0) {
    const prevBalance = await AccountBalance.findOne({
      where: {
        accountId,
        fiscalPeriodId: previousPeriods[0].id,
      },
      transaction,
    });
    openingBalance = prevBalance ? Number(prevBalance.closingBalance) : 0;
  } else {
    openingBalance = Number(account.openingBalance);
  }

  // Sum all GL entries for this period
  const glEntries = await GeneralLedger.findAll({
    where: {
      accountId,
      fiscalPeriodId,
      isReversed: false,
    },
    transaction,
  });

  let debitTotal = 0;
  let creditTotal = 0;

  for (const entry of glEntries) {
    debitTotal += Number(entry.debitAmount);
    creditTotal += Number(entry.creditAmount);
  }

  // Calculate net movement
  const netMovement = debitTotal - creditTotal;

  // Calculate closing balance based on normal balance
  let closingBalance;
  if (account.normalBalance === 'debit') {
    closingBalance = openingBalance + netMovement;
  } else {
    closingBalance = openingBalance - netMovement;
  }

  // Calculate YTD
  const allPeriodsThisYear = await FiscalPeriod.findAll({
    where: {
      companyId: account.companyId,
      fiscalYearId: period.fiscalYearId,
    },
    order: [['periodNumber', 'ASC']],
    transaction,
  });

  const periodIds = allPeriodsThisYear.slice(0, period.periodNumber).map(p => p.id);

  const ytdEntries = await GeneralLedger.findAll({
    where: {
      accountId,
      fiscalPeriodId: periodIds,
      isReversed: false,
    },
    transaction,
  });

  let ytdDebit = 0;
  let ytdCredit = 0;

  for (const entry of ytdEntries) {
    ytdDebit += Number(entry.debitAmount);
    ytdCredit += Number(entry.creditAmount);
  }

  const ytdBalance = openingBalance + (ytdDebit - ytdCredit);

  // Upsert account balance
  await AccountBalance.upsert(
    {
      companyId: account.companyId,
      accountId,
      fiscalYearId: period.fiscalYearId,
      fiscalPeriodId,
      openingBalance,
      debitTotal,
      creditTotal,
      netMovement,
      closingBalance,
      ytdDebit,
      ytdCredit,
      ytdBalance,
      lastUpdated: new Date(),
      calculatedAt: new Date(),
    },
    { transaction }
  );

  // Update current balance on account
  await account.update(
    {
      currentBalance: closingBalance,
    },
    { transaction }
  );
}

/**
 * Reverse a posted journal entry
 */
export async function reverseJournalEntry(
  journalEntryId: string,
  reversalDate: Date,
  description: string | undefined,
  userId: string
): Promise<PostingResult> {
  let transaction: Transaction | null = null;

  try {
    transaction = await sequelize.transaction();

    // Get original journal entry
    const originalJE = await JournalEntry.findByPk(journalEntryId, {
      include: [{ model: JournalEntryLine, as: 'lines' }],
      transaction,
    });

    if (!originalJE) {
      throw createValidationError('Journal entry not found');
    }

    // Validate reversal
    if (!originalJE.isPosted) {
      throw createValidationError('Can only reverse posted journal entries');
    }

    if (originalJE.isReversed) {
      throw createValidationError('Journal entry is already reversed');
    }

    // Get fiscal period for reversal date
    const reversalPeriod = await FiscalPeriod.findOne({
      where: {
        companyId: originalJE.companyId,
        startDate: { [sequelize.Sequelize.Op.lte]: reversalDate },
        endDate: { [sequelize.Sequelize.Op.gte]: reversalDate },
      },
      transaction,
    });

    if (!reversalPeriod || reversalPeriod.status !== 'open') {
      throw createValidationError('Reversal date must be in an open fiscal period');
    }

    // Generate new journal number
    const journalNumber = await generateJournalNumber(originalJE.companyId, transaction);

    // Create reversal journal entry with swapped debits/credits
    const reversalJE = await JournalEntry.create(
      {
        companyId: originalJE.companyId,
        journalNumber,
        referenceNumber: originalJE.journalNumber,
        documentType: 'reversing',
        transactionDate: reversalDate,
        postingDate: reversalDate,
        description: description || `Reversal of ${originalJE.journalNumber}: ${originalJE.description}`,
        notes: `Reversal of journal entry ${originalJE.journalNumber}`,
        fiscalYearId: reversalPeriod.fiscalYearId,
        fiscalPeriodId: reversalPeriod.id,
        currencyCode: originalJE.currencyCode,
        exchangeRate: originalJE.exchangeRate,
        status: 'draft',
        isPosted: false,
        requiresApproval: false,
        isReversed: false,
        originalJournalId: originalJE.id,
        totalDebit: originalJE.totalCredit, // Swapped
        totalCredit: originalJE.totalDebit, // Swapped
        sourceModule: originalJE.sourceModule,
        sourceDocumentType: originalJE.sourceDocumentType,
        sourceDocumentId: originalJE.sourceDocumentId,
        createdBy: userId,
        updatedBy: userId,
      },
      { transaction }
    );

    // Create reversal lines (swap debits and credits)
    const lines = (originalJE as any).lines || [];
    for (const originalLine of lines) {
      await JournalEntryLine.create(
        {
          companyId: originalJE.companyId,
          journalEntryId: reversalJE.id,
          lineNumber: originalLine.lineNumber,
          description: originalLine.description,
          accountId: originalLine.accountId,
          accountCode: originalLine.accountCode,
          accountName: originalLine.accountName,
          debitAmount: originalLine.creditAmount, // Swapped
          creditAmount: originalLine.debitAmount, // Swapped
          debitAmountFC: originalLine.creditAmountFC,
          creditAmountFC: originalLine.debitAmountFC,
          currencyCode: originalLine.currencyCode,
          exchangeRate: originalLine.exchangeRate,
        },
        { transaction }
      );
    }

    // Post the reversal immediately
    await reversalJE.update(
      {
        status: 'posted',
        isPosted: true,
        postedAt: new Date(),
        postedBy: userId,
      },
      { transaction }
    );

    // Post reversal to GL
    const result = await postJournalEntry(reversalJE.id, userId);

    // Mark original as reversed
    await originalJE.update(
      {
        isReversed: true,
        reversedAt: new Date(),
        reversedBy: userId,
        reversalJournalId: reversalJE.id,
      },
      { transaction }
    );

    await transaction.commit();

    logger.info('Journal entry reversed successfully', {
      originalJournalId: originalJE.id,
      reversalJournalId: reversalJE.id,
      userId,
    });

    return {
      success: true,
      journalEntry: reversalJE,
      generalLedgerEntries: result.generalLedgerEntries,
      message: 'Journal entry reversed successfully',
    };
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    logger.error('Failed to reverse journal entry', {
      journalEntryId,
      error,
    });

    throw error;
  }
}

/**
 * Generate next journal number
 */
async function generateJournalNumber(
  companyId: string,
  transaction: Transaction
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `JE-${year}-`;

  // Get the last journal number for this year
  const lastJE = await JournalEntry.findOne({
    where: {
      companyId,
      journalNumber: {
        [sequelize.Sequelize.Op.like]: `${prefix}%`,
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
