import { Transaction } from 'sequelize';
import sequelize from '../db/sequelize';
import { Invoice, InvoiceLine, CustomerPayment, CustomerPaymentAllocation, Customer, ChartOfAccount, JournalEntry } from '../db/models';
import { postJournalEntry } from '../gl/posting-engine';
import { createValidationError } from '../error-handler';
import logger from '../logger';

/**
 * Post Invoice to General Ledger
 * Creates a journal entry for an invoice:
 * DR - Accounts Receivable (customer's AR account)
 * CR - Revenue Accounts (from invoice lines)
 * CR - Tax Account (if applicable)
 */
export async function postInvoice(invoiceId: string, userId: string) {
  let transaction: Transaction | null = null;

  try {
    transaction = await sequelize.transaction();

    // Fetch invoice with lines and customer
    const invoice = await Invoice.findByPk(invoiceId, {
      include: [
        {
          model: InvoiceLine,
          as: 'lines',
          include: [
            {
              model: ChartOfAccount,
              as: 'revenueAccount',
            },
          ],
        },
        {
          model: Customer,
          as: 'customer',
        },
      ],
      transaction,
    });

    if (!invoice) {
      throw createValidationError('Invoice not found', 'invoiceId');
    }

    if (invoice.isPosted) {
      throw createValidationError('Invoice is already posted', 'invoiceId');
    }

    if (invoice.status !== 'approved') {
      throw createValidationError('Only approved invoices can be posted', 'status');
    }

    if (invoice.isVoid) {
      throw createValidationError('Cannot post voided invoice', 'isVoid');
    }

    const lines = invoice.get('lines') as InvoiceLine[];
    if (!lines || lines.length === 0) {
      throw createValidationError('Invoice has no line items', 'lines');
    }

    // Prepare journal entry lines
    const journalLines: any[] = [];
    let lineNumber = 1;

    // Debit line - Accounts Receivable
    const customer = invoice.get('customer') as Customer;
    journalLines.push({
      lineNumber: lineNumber++,
      description: `Invoice ${invoice.invoiceNumber} - ${customer.customerName}`,
      accountId: customer.defaultARAccountId,
      accountCode: '', // Will be filled by JE creation
      accountName: '', // Will be filled by JE creation
      debitAmount: invoice.totalAmount,
      creditAmount: 0,
      currencyCode: invoice.currencyCode,
      exchangeRate: invoice.exchangeRate,
    });

    // Credit lines - Revenue accounts (from invoice lines)
    for (const invoiceLine of lines) {
      journalLines.push({
        lineNumber: lineNumber++,
        description: `${invoiceLine.itemName} - ${invoice.invoiceNumber}`,
        accountId: invoiceLine.revenueAccountId,
        accountCode: invoiceLine.revenueAccountCode,
        accountName: '',
        debitAmount: 0,
        creditAmount: invoiceLine.lineTotal,
        currencyCode: invoice.currencyCode,
        exchangeRate: invoice.exchangeRate,
      });
    }

    // Credit line - Tax account (if applicable)
    if (invoice.taxAmount > 0) {
      // Get company's tax account
      const taxAccount = await ChartOfAccount.findOne({
        where: {
          companyId: invoice.companyId,
          accountType: 'liability',
          name: { [sequelize.Sequelize.Op.iLike]: '%tax%payable%' },
        },
        transaction,
      });

      if (taxAccount) {
        journalLines.push({
          lineNumber: lineNumber++,
          description: `Sales Tax - ${invoice.invoiceNumber}`,
          accountId: taxAccount.id,
          accountCode: taxAccount.code,
          accountName: taxAccount.name,
          debitAmount: 0,
          creditAmount: invoice.taxAmount,
          currencyCode: invoice.currencyCode,
          exchangeRate: invoice.exchangeRate,
        });
      }
    }

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
        companyId: invoice.companyId,
        journalNumber: '', // Will be auto-generated
        referenceNumber: invoice.invoiceNumber,
        documentType: 'ar_invoice',
        transactionDate: invoice.invoiceDate,
        postingDate: new Date(),
        description: `Invoice ${invoice.invoiceNumber} - ${customer.customerName}`,
        notes: invoice.notes,
        fiscalYearId: '', // Will be set by posting engine
        fiscalPeriodId: '', // Will be set by posting engine
        currencyCode: invoice.currencyCode,
        exchangeRate: invoice.exchangeRate,
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

    // Temporary link
    await invoice.update(
      {
        journalEntryId: journalEntry.id,
      },
      { transaction }
    );

    await transaction.commit();

    // Post the journal entry using GL posting engine
    const result = await postJournalEntry(journalEntry.id, userId);

    // Update invoice status
    await invoice.update({
      status: 'sent',
      isPosted: true,
      postedAt: new Date(),
      postedBy: userId,
      balanceAmount: invoice.totalAmount,
      paymentStatus: 'unpaid',
      updatedBy: userId,
    });

    // Update customer balance
    await customer.update({
      currentBalance: Number(customer.currentBalance) + Number(invoice.totalAmount),
      totalSales: Number(customer.totalSales) + Number(invoice.totalAmount),
      lastSaleDate: invoice.invoiceDate,
    });

    logger.info('Invoice posted to GL', {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      journalEntryId: journalEntry.id,
      totalAmount: invoice.totalAmount,
      userId,
    });

    return {
      success: true,
      invoice,
      journalEntry: result.journalEntry,
      generalLedgerEntries: result.generalLedgerEntries,
      message: `Invoice ${invoice.invoiceNumber} posted successfully`,
    };
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    logger.error('Error posting invoice to GL', { invoiceId, error });
    throw error;
  }
}

/**
 * Post Customer Payment to General Ledger
 * Creates a journal entry for a payment:
 * DR - Cash/Bank Account
 * CR - Accounts Receivable (customer's AR account)
 * CR - Discount Account (if discount given)
 */
export async function postCustomerPayment(paymentId: string, userId: string) {
  let transaction: Transaction | null = null;

  try {
    transaction = await sequelize.transaction();

    // Fetch payment with allocations and customer
    const payment = await CustomerPayment.findByPk(paymentId, {
      include: [
        {
          model: CustomerPaymentAllocation,
          as: 'allocations',
          include: [
            {
              model: Invoice,
              as: 'invoice',
            },
          ],
        },
        {
          model: Customer,
          as: 'customer',
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

    if (payment.status !== 'approved' && payment.status !== 'draft') {
      throw createValidationError('Only approved or draft payments can be posted', 'status');
    }

    if (payment.isVoid) {
      throw createValidationError('Cannot post voided payment', 'isVoid');
    }

    const customer = payment.get('customer') as Customer;
    const allocations = payment.get('allocations') as CustomerPaymentAllocation[];

    // Calculate totals
    let totalAllocated = 0;
    let totalDiscount = 0;

    if (allocations && allocations.length > 0) {
      for (const allocation of allocations) {
        totalAllocated += Number(allocation.allocatedAmount);
        totalDiscount += Number(allocation.discountGiven);
      }
    }

    // Prepare journal entry lines
    const journalLines: any[] = [];
    let lineNumber = 1;

    // Debit line - Cash/Bank Account
    let bankAccountId = payment.bankAccountId;
    if (!bankAccountId) {
      // Get default cash account
      const cashAccount = await ChartOfAccount.findOne({
        where: {
          companyId: payment.companyId,
          accountType: 'asset',
          name: { [sequelize.Sequelize.Op.iLike]: '%cash%' },
        },
        transaction,
      });
      bankAccountId = cashAccount?.id || '';
    }

    const bankAccount = await ChartOfAccount.findByPk(bankAccountId, { transaction });
    if (!bankAccount) {
      throw createValidationError('Bank account not found', 'bankAccountId');
    }

    journalLines.push({
      lineNumber: lineNumber++,
      description: `Payment ${payment.paymentNumber} from ${customer.customerName}`,
      accountId: bankAccount.id,
      accountCode: bankAccount.code,
      accountName: bankAccount.name,
      debitAmount: payment.paymentAmount,
      creditAmount: 0,
      currencyCode: payment.currencyCode,
      exchangeRate: payment.exchangeRate,
    });

    // Credit line - Accounts Receivable
    journalLines.push({
      lineNumber: lineNumber++,
      description: `Payment ${payment.paymentNumber} - ${customer.customerName}`,
      accountId: customer.defaultARAccountId,
      accountCode: '',
      accountName: '',
      debitAmount: 0,
      creditAmount: totalAllocated,
      currencyCode: payment.currencyCode,
      exchangeRate: payment.exchangeRate,
    });

    // Credit line - Discount Account (if applicable)
    if (totalDiscount > 0) {
      const discountAccount = await ChartOfAccount.findOne({
        where: {
          companyId: payment.companyId,
          accountType: 'revenue',
          name: { [sequelize.Sequelize.Op.iLike]: '%discount%' },
        },
        transaction,
      });

      if (discountAccount) {
        journalLines.push({
          lineNumber: lineNumber++,
          description: `Discount given - ${payment.paymentNumber}`,
          accountId: discountAccount.id,
          accountCode: discountAccount.code,
          accountName: discountAccount.name,
          debitAmount: 0,
          creditAmount: totalDiscount,
          currencyCode: payment.currencyCode,
          exchangeRate: payment.exchangeRate,
        });
      }
    }

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
        documentType: 'ar_payment',
        transactionDate: payment.paymentDate,
        postingDate: new Date(),
        description: `Payment ${payment.paymentNumber} from ${customer.customerName}`,
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

    // Post the journal entry
    const result = await postJournalEntry(journalEntry.id, userId);

    // Update payment status
    await payment.update({
      status: 'posted',
      isPosted: true,
      postedAt: new Date(),
      postedBy: userId,
      allocatedAmount: totalAllocated + totalDiscount,
      unappliedAmount: payment.paymentAmount - (totalAllocated + totalDiscount),
      updatedBy: userId,
    });

    // Update invoice balances and statuses
    if (allocations && allocations.length > 0) {
      for (const allocation of allocations) {
        const invoice = allocation.get('invoice') as Invoice;
        const newPaidAmount = Number(invoice.paidAmount) + Number(allocation.allocatedAmount) + Number(allocation.discountGiven);
        const newBalance = Number(invoice.totalAmount) - newPaidAmount;

        let newPaymentStatus = invoice.paymentStatus;
        if (newBalance <= 0.01) {
          newPaymentStatus = 'paid';
        } else if (newPaidAmount > 0) {
          newPaymentStatus = 'partial';
        }

        await invoice.update({
          paidAmount: newPaidAmount,
          balanceAmount: newBalance,
          paymentStatus: newPaymentStatus,
        });
      }
    }

    // Update customer balance
    await customer.update({
      currentBalance: Number(customer.currentBalance) - Number(payment.paymentAmount),
      totalCollected: Number(customer.totalCollected) + Number(payment.paymentAmount),
      lastPaymentDate: payment.paymentDate,
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
