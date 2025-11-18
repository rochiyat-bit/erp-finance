import { Transaction } from 'sequelize';
import sequelize from '../db/sequelize';
import { Bill, BillLine, BillPayment, PaymentAllocation, JournalEntry, JournalEntryLine, Vendor } from '../db/models';
import { postJournalEntry } from '../gl/posting-engine';
import { createValidationError } from '../error-handler';
import logger from '../logger';

/**
 * Post Bill to General Ledger
 * Creates a journal entry for a bill:
 * DR - Expense/Asset Accounts (from bill lines)
 * CR - Accounts Payable
 */
export async function postBill(billId: string, userId: string) {
  let transaction: Transaction | null = null;

  try {
    transaction = await sequelize.transaction();

    // Fetch bill with lines and vendor
    const bill = await Bill.findByPk(billId, {
      include: [
        {
          model: BillLine,
          as: 'lines',
        },
        {
          model: Vendor,
          as: 'vendor',
        },
      ],
      transaction,
    });

    if (!bill) {
      throw createValidationError('Bill not found', 'billId');
    }

    if (bill.isPosted) {
      throw createValidationError('Bill is already posted', 'billId');
    }

    if (bill.status !== 'approved') {
      throw createValidationError('Only approved bills can be posted', 'status');
    }

    const lines = bill.get('lines') as BillLine[];
    if (!lines || lines.length === 0) {
      throw createValidationError('Bill has no line items', 'lines');
    }

    // Prepare journal entry lines
    const journalLines: any[] = [];
    let lineNumber = 1;

    // Debit lines - Expenses/Assets (from bill lines)
    for (const billLine of lines) {
      journalLines.push({
        lineNumber: lineNumber++,
        description: `${billLine.itemName} - ${bill.billNumber}`,
        accountId: billLine.expenseAccountId,
        accountCode: billLine.accountCode,
        accountName: billLine.accountName,
        debitAmount: billLine.totalAmount,
        creditAmount: 0,
        currencyCode: bill.currencyCode,
        exchangeRate: bill.exchangeRate,
      });
    }

    // Credit line - Accounts Payable
    journalLines.push({
      lineNumber: lineNumber++,
      description: `AP - ${(bill.get('vendor') as Vendor).vendorName} - ${bill.billNumber}`,
      accountId: bill.apAccountId,
      accountCode: '', // Will be filled by JE creation
      accountName: '', // Will be filled by JE creation
      debitAmount: 0,
      creditAmount: bill.totalAmount,
      currencyCode: bill.currencyCode,
      exchangeRate: bill.exchangeRate,
    });

    // Validate debits = credits
    const totalDebit = journalLines.reduce((sum, line) => sum + line.debitAmount, 0);
    const totalCredit = journalLines.reduce((sum, line) => sum + line.creditAmount, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw createValidationError(
        `Journal entry is unbalanced: DR ${totalDebit} != CR ${totalCredit}`,
        'totalAmount'
      );
    }

    // Create journal entry
    const journalEntry = await JournalEntry.create(
      {
        companyId: bill.companyId,
        journalNumber: '', // Will be auto-generated
        referenceNumber: bill.billNumber,
        documentType: 'ap_bill',
        transactionDate: bill.billDate,
        postingDate: bill.postingDate || new Date(),
        description: `Bill ${bill.billNumber} - ${(bill.get('vendor') as Vendor).vendorName}`,
        notes: bill.notes,
        fiscalYearId: '', // Will be set by posting engine
        fiscalPeriodId: '', // Will be set by posting engine
        currencyCode: bill.currencyCode,
        exchangeRate: bill.exchangeRate,
        status: 'draft',
        isPosted: false,
        requiresApproval: false,
        isReversed: false,
        isRecurring: false,
        totalDebit: totalDebit,
        totalCredit: totalCredit,
        createdBy: userId,
        updatedBy: userId,
      },
      { transaction }
    );

    // This is a temporary save - the posting engine will finalize it
    await bill.update(
      {
        journalEntryId: journalEntry.id,
      },
      { transaction }
    );

    await transaction.commit();

    // Now post the journal entry using the GL posting engine
    const result = await postJournalEntry(journalEntry.id, userId);

    // Update bill status to posted
    await bill.update({
      status: 'posted',
      isPosted: true,
      postingDate: new Date(),
      outstandingAmount: bill.totalAmount,
      updatedBy: userId,
    });

    // Update vendor balance
    const vendor = bill.get('vendor') as Vendor;
    await vendor.update({
      currentBalance: Number(vendor.currentBalance) + Number(bill.totalAmount),
      ytdPurchases: Number(vendor.ytdPurchases) + Number(bill.totalAmount),
    });

    logger.info('Bill posted to GL', {
      billId: bill.id,
      billNumber: bill.billNumber,
      journalEntryId: journalEntry.id,
      totalAmount: bill.totalAmount,
      userId,
    });

    return {
      success: true,
      bill,
      journalEntry: result.journalEntry,
      generalLedgerEntries: result.generalLedgerEntries,
      message: `Bill ${bill.billNumber} posted successfully`,
    };
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    logger.error('Error posting bill to GL', { billId, error });
    throw error;
  }
}

/**
 * Post Payment to General Ledger
 * Creates a journal entry for a payment:
 * DR - Accounts Payable
 * CR - Bank/Cash Account
 *
 * If allocations include discounts or write-offs:
 * DR - Purchase Discount (for early payment discount)
 * DR - Bad Debt Write-off (for write-offs)
 */
export async function postPayment(paymentId: string, userId: string) {
  let transaction: Transaction | null = null;

  try {
    transaction = await sequelize.transaction();

    // Fetch payment with allocations and vendor
    const payment = await BillPayment.findByPk(paymentId, {
      include: [
        {
          model: PaymentAllocation,
          as: 'allocations',
          include: [
            {
              model: Bill,
              as: 'bill',
            },
          ],
        },
        {
          model: Vendor,
          as: 'vendor',
        },
      ],
      transaction,
    });

    if (!payment) {
      throw createValidationError('Payment not found', 'paymentId');
    }

    if (payment.isPosted) {
      throw createValidationError('Payment is already posted', 'paymentId');
    }

    if (payment.status !== 'approved') {
      throw createValidationError('Only approved payments can be posted', 'status');
    }

    // Prepare journal entry lines
    const journalLines: any[] = [];
    let lineNumber = 1;

    const allocations = payment.get('allocations') as PaymentAllocation[];

    // Calculate totals
    let totalAllocated = 0;
    let totalDiscount = 0;
    let totalWriteOff = 0;

    if (allocations && allocations.length > 0) {
      for (const allocation of allocations) {
        totalAllocated += Number(allocation.allocationAmount);
        totalDiscount += Number(allocation.discountTaken);
        totalWriteOff += Number(allocation.writeOffAmount);
      }
    }

    // Debit line - Accounts Payable
    journalLines.push({
      lineNumber: lineNumber++,
      description: `Payment ${payment.paymentNumber} - ${(payment.get('vendor') as Vendor).vendorName}`,
      accountId: payment.apAccountId,
      accountCode: '', // Will be filled by JE creation
      accountName: '', // Will be filled by JE creation
      debitAmount: totalAllocated,
      creditAmount: 0,
      currencyCode: payment.currencyCode,
      exchangeRate: payment.exchangeRate,
    });

    // Debit line - Purchase Discount (if any)
    if (totalDiscount > 0) {
      // Use discount account from first allocation that has it
      const discountAlloc = allocations.find(a => a.discountAccountId);
      if (discountAlloc && discountAlloc.discountAccountId) {
        journalLines.push({
          lineNumber: lineNumber++,
          description: `Early payment discount - ${payment.paymentNumber}`,
          accountId: discountAlloc.discountAccountId,
          accountCode: '',
          accountName: '',
          debitAmount: totalDiscount,
          creditAmount: 0,
          currencyCode: payment.currencyCode,
          exchangeRate: payment.exchangeRate,
        });
      }
    }

    // Debit line - Write-off (if any)
    if (totalWriteOff > 0) {
      // Use write-off account from first allocation that has it
      const writeOffAlloc = allocations.find(a => a.writeOffAccountId);
      if (writeOffAlloc && writeOffAlloc.writeOffAccountId) {
        journalLines.push({
          lineNumber: lineNumber++,
          description: `Payment write-off - ${payment.paymentNumber}`,
          accountId: writeOffAlloc.writeOffAccountId,
          accountCode: '',
          accountName: '',
          debitAmount: totalWriteOff,
          creditAmount: 0,
          currencyCode: payment.currencyCode,
          exchangeRate: payment.exchangeRate,
        });
      }
    }

    // Credit line - Bank/Cash Account
    journalLines.push({
      lineNumber: lineNumber++,
      description: `Payment via ${payment.paymentMethod} - ${payment.paymentNumber}`,
      accountId: payment.bankAccountId,
      accountCode: payment.bankAccountCode,
      accountName: payment.bankAccountName,
      debitAmount: 0,
      creditAmount: payment.paymentAmount,
      currencyCode: payment.currencyCode,
      exchangeRate: payment.exchangeRate,
    });

    // Validate debits = credits
    const totalDebit = journalLines.reduce((sum, line) => sum + line.debitAmount, 0);
    const totalCredit = journalLines.reduce((sum, line) => sum + line.creditAmount, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw createValidationError(
        `Journal entry is unbalanced: DR ${totalDebit} != CR ${totalCredit}`,
        'paymentAmount'
      );
    }

    // Create journal entry
    const journalEntry = await JournalEntry.create(
      {
        companyId: payment.companyId,
        journalNumber: '',
        referenceNumber: payment.paymentNumber,
        documentType: 'ap_payment',
        transactionDate: payment.paymentDate,
        postingDate: payment.postingDate || new Date(),
        description: `Payment ${payment.paymentNumber} - ${(payment.get('vendor') as Vendor).vendorName}`,
        notes: payment.notes,
        fiscalYearId: '',
        fiscalPeriodId: '',
        currencyCode: payment.currencyCode,
        exchangeRate: payment.exchangeRate,
        status: 'draft',
        isPosted: false,
        requiresApproval: false,
        isReversed: false,
        isRecurring: false,
        totalDebit: totalDebit,
        totalCredit: totalCredit,
        createdBy: userId,
        updatedBy: userId,
      },
      { transaction }
    );

    await payment.update(
      {
        journalEntryId: journalEntry.id,
      },
      { transaction }
    );

    await transaction.commit();

    // Post the journal entry using GL posting engine
    const result = await postJournalEntry(journalEntry.id, userId);

    // Update payment status
    await payment.update({
      status: 'posted',
      isPosted: true,
      postingDate: new Date(),
      allocatedAmount: totalAllocated + totalDiscount + totalWriteOff,
      unappliedAmount: payment.paymentAmount - (totalAllocated + totalDiscount + totalWriteOff),
      updatedBy: userId,
    });

    // Update bill statuses and outstanding amounts
    if (allocations && allocations.length > 0) {
      for (const allocation of allocations) {
        const bill = allocation.get('bill') as Bill;
        const newPaidAmount = Number(bill.paidAmount) + Number(allocation.totalApplied);
        const newOutstanding = Number(bill.totalAmount) - newPaidAmount;

        let newStatus = bill.status;
        if (newOutstanding <= 0.01) {
          newStatus = 'paid';
        } else if (newPaidAmount > 0) {
          newStatus = 'partially_paid';
        }

        await bill.update({
          paidAmount: newPaidAmount,
          outstandingAmount: newOutstanding,
          status: newStatus,
        });
      }
    }

    // Update vendor balance
    const vendor = payment.get('vendor') as Vendor;
    await vendor.update({
      currentBalance: Number(vendor.currentBalance) - Number(payment.paymentAmount),
    });

    logger.info('Payment posted to GL', {
      paymentId: payment.id,
      paymentNumber: payment.paymentNumber,
      journalEntryId: journalEntry.id,
      paymentAmount: payment.paymentAmount,
      userId,
    });

    return {
      success: true,
      payment,
      journalEntry: result.journalEntry,
      generalLedgerEntries: result.generalLedgerEntries,
      message: `Payment ${payment.paymentNumber} posted successfully`,
    };
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    logger.error('Error posting payment to GL', { paymentId, error });
    throw error;
  }
}
