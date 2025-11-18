import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Invoice, InvoiceLine, Customer, ChartOfAccount, SalesOrder } from '@/lib/db/models';
import { createInvoiceSchema, listInvoicesQuerySchema } from '@/lib/validators/ar';
import { createValidationError, formatErrorResponse, createPermissionError } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';
import { Op } from 'sequelize';
import sequelize from '@/lib/db/sequelize';

// GET /api/ar/invoices - List invoices
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    // Check permission
    if (!hasPermission(user, 'ar.invoices.view')) {
      throw createPermissionError('Insufficient permissions to view invoices');
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const query = listInvoicesQuerySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      status: searchParams.get('status'),
      paymentStatus: searchParams.get('paymentStatus'),
      customerId: searchParams.get('customerId'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      search: searchParams.get('search'),
      overdue: searchParams.get('overdue'),
    });

    // Build where clause
    const where: any = {
      companyId: user.companyId,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.paymentStatus) {
      where.paymentStatus = query.paymentStatus;
    }

    if (query.customerId) {
      where.customerId = query.customerId;
    }

    if (query.startDate && query.endDate) {
      where.invoiceDate = {
        [Op.between]: [new Date(query.startDate), new Date(query.endDate)],
      };
    }

    if (query.overdue) {
      where.isOverdue = true;
    }

    if (query.search) {
      where[Op.or] = [
        { invoiceNumber: { [Op.iLike]: `%${query.search}%` } },
        { customerName: { [Op.iLike]: `%${query.search}%` } },
        { referenceNumber: { [Op.iLike]: `%${query.search}%` } },
        { description: { [Op.iLike]: `%${query.search}%` } },
      ];
    }

    // Pagination
    const limit = query.limit;
    const offset = (query.page - 1) * limit;

    // Fetch invoices with count
    const { count, rows: invoices } = await Invoice.findAndCountAll({
      where,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customerCode', 'customerName'],
        },
        {
          model: InvoiceLine,
          as: 'lines',
          attributes: ['id', 'lineNumber', 'itemName', 'quantity', 'unitPrice', 'lineTotal'],
        },
      ],
      order: [['invoiceDate', 'DESC'], ['createdAt', 'DESC']],
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      invoices,
      pagination: {
        page: query.page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    logger.error('Error listing invoices', { error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// POST /api/ar/invoices - Create invoice
export async function POST(req: NextRequest) {
  let transaction: any = null;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    // Check permission
    if (!hasPermission(user, 'ar.invoices.create')) {
      throw createPermissionError('Insufficient permissions to create invoices');
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = createInvoiceSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      throw createValidationError(firstError.message, firstError.path.join('.'));
    }

    const data = validation.data;

    // Start transaction
    transaction = await sequelize.transaction();

    // Verify customer exists
    const customer = await Customer.findOne({
      where: {
        id: data.customerId,
        companyId: user.companyId,
      },
      transaction,
    });

    if (!customer) {
      throw createValidationError('Customer not found', 'customerId');
    }

    if (customer.status === 'blocked') {
      throw createValidationError('Customer is blocked', 'customerId');
    }

    // Check credit limit if needed
    if (customer.creditLimit > 0) {
      const potentialBalance = Number(customer.currentBalance) + data.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
      if (potentialBalance > customer.creditLimit) {
        logger.warn('Customer exceeds credit limit', {
          customerId: customer.id,
          creditLimit: customer.creditLimit,
          potentialBalance,
        });
        // Just warn, don't block
      }
    }

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(user.companyId, transaction);

    // Calculate amounts from lines
    let calculatedSubtotal = 0;
    let calculatedTax = 0;
    let calculatedDiscount = 0;

    for (const line of data.lines) {
      const lineAmount = line.quantity * line.unitPrice;
      const lineDiscount = (lineAmount * line.discountPercent) / 100;
      const lineAfterDiscount = lineAmount - lineDiscount;
      const lineTax = (lineAfterDiscount * line.taxPercent) / 100;

      calculatedSubtotal += lineAmount;
      calculatedDiscount += lineDiscount;
      calculatedTax += lineTax;
    }

    const totalAmount =
      calculatedSubtotal -
      calculatedDiscount +
      calculatedTax +
      data.shippingAmount +
      data.otherCharges;

    // Calculate due date
    const invoiceDate = new Date(data.invoiceDate);
    const dueDate = data.dueDate
      ? new Date(data.dueDate)
      : new Date(invoiceDate.getTime() + (data.paymentTermDays || customer.paymentTermDays) * 24 * 60 * 60 * 1000);

    // Create invoice
    const invoice = await Invoice.create(
      {
        companyId: user.companyId,
        invoiceNumber,
        referenceNumber: data.referenceNumber || null,
        salesOrderId: data.salesOrderId || null,
        soNumber: null,
        customerPONumber: data.customerPONumber || null,

        customerId: data.customerId,
        customerName: customer.customerName,
        customerAddress: `${customer.billingAddressLine1}, ${customer.billingCity}, ${customer.billingState} ${customer.billingPostalCode}`,
        customerTaxId: customer.taxId,

        invoiceDate: invoiceDate,
        dueDate: dueDate,
        deliveryDate: null,

        currencyCode: data.currencyCode,
        exchangeRate: data.exchangeRate,
        paymentTerms: data.paymentTerms || customer.paymentTerms,
        paymentTermDays: data.paymentTermDays || customer.paymentTermDays,

        subtotal: calculatedSubtotal,
        discountPercent: data.discountPercent,
        discountAmount: calculatedDiscount,
        taxAmount: calculatedTax,
        shippingAmount: data.shippingAmount,
        otherCharges: data.otherCharges,
        totalAmount,

        paidAmount: 0,
        balanceAmount: 0,
        paymentStatus: 'unpaid',

        status: data.requiresApproval ? 'pending_approval' : 'draft',

        requiresApproval: data.requiresApproval,
        approvalStatus: null,
        approvedBy: null,
        approvedAt: null,
        rejectionReason: null,

        isPosted: false,
        postedAt: null,
        postedBy: null,
        journalEntryId: null,

        daysPastDue: 0,
        isOverdue: false,

        salesPersonId: customer.salesPersonId,
        salesPersonName: null,

        description: data.description || null,
        notes: data.notes || null,
        internalNotes: data.internalNotes || null,
        terms: data.terms || null,

        sentToCustomerAt: null,
        sentToCustomerEmail: null,
        emailCount: 0,
        lastEmailedAt: null,

        createdBy: user.id,
        updatedBy: user.id,

        isVoid: false,
        voidedAt: null,
        voidedBy: null,
        voidReason: null,
      },
      { transaction }
    );

    // Create invoice lines
    const lines = [];
    for (let i = 0; i < data.lines.length; i++) {
      const lineData = data.lines[i];

      // Get revenue account details
      const revenueAccount = await ChartOfAccount.findByPk(lineData.revenueAccountId, { transaction });
      if (!revenueAccount) {
        throw createValidationError(`Revenue account not found: ${lineData.revenueAccountId}`, 'lines');
      }

      if (!revenueAccount.isActive) {
        throw createValidationError(`Revenue account is inactive: ${revenueAccount.code}`, 'lines');
      }

      const lineAmount = lineData.quantity * lineData.unitPrice;
      const lineDiscount = (lineAmount * lineData.discountPercent) / 100;
      const lineAfterDiscount = lineAmount - lineDiscount;
      const lineTax = (lineAfterDiscount * lineData.taxPercent) / 100;
      const lineTotal = lineAfterDiscount + lineTax;

      const line = await InvoiceLine.create(
        {
          companyId: user.companyId,
          invoiceId: invoice.id,
          salesOrderLineId: lineData.salesOrderLineId || null,
          lineNumber: i + 1,

          itemCode: lineData.itemCode || null,
          itemName: lineData.itemName,
          description: lineData.description || null,

          quantity: lineData.quantity,
          unit: lineData.unit,
          unitPrice: lineData.unitPrice,
          discountPercent: lineData.discountPercent,
          discountAmount: lineDiscount,
          taxPercent: lineData.taxPercent,
          taxAmount: lineTax,
          lineTotal,

          revenueAccountId: revenueAccount.id,
          revenueAccountCode: revenueAccount.code,

          costCenterId: null,
          projectId: null,
          departmentId: null,

          notes: lineData.notes || null,
        },
        { transaction }
      );

      lines.push(line);
    }

    // If autoPost is true and no approval required, approve immediately
    if (data.autoPost && !data.requiresApproval) {
      await invoice.update(
        {
          status: 'approved',
          approvedBy: user.id,
          approvedAt: new Date(),
        },
        { transaction }
      );
    }

    await transaction.commit();

    logger.info('Invoice created', {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: customer.id,
      totalAmount,
      userId: user.id,
    });

    return NextResponse.json(
      {
        success: true,
        invoice,
        lines,
      },
      { status: 201 }
    );
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    logger.error('Error creating invoice', { error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// Helper function to generate invoice number
async function generateInvoiceNumber(companyId: string, transaction: any): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  // Get the last invoice number for this year
  const lastInvoice = await Invoice.findOne({
    where: {
      companyId,
      invoiceNumber: {
        [Op.like]: `${prefix}%`,
      },
    },
    order: [['createdAt', 'DESC']],
    transaction,
  });

  let nextNumber = 1;
  if (lastInvoice) {
    const lastNumberStr = lastInvoice.invoiceNumber.replace(prefix, '');
    const lastNumber = parseInt(lastNumberStr, 10);
    nextNumber = lastNumber + 1;
  }

  // Pad with zeros to 5 digits
  const paddedNumber = nextNumber.toString().padStart(5, '0');
  return `${prefix}${paddedNumber}`;
}
