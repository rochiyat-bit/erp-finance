import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Bill, BillLine, Vendor, ChartOfAccount } from '@/lib/db/models';
import { createBillSchema, listBillsQuerySchema } from '@/lib/validators/ap';
import { createValidationError, formatErrorResponse, createPermissionError } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';
import { Op } from 'sequelize';
import sequelize from '@/lib/db/sequelize';

// GET /api/ap/bills - List bills
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    // Check permission
    if (!hasPermission(user, 'ap.bills.view')) {
      throw createPermissionError('Insufficient permissions to view bills');
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const query = listBillsQuerySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      status: searchParams.get('status'),
      vendorId: searchParams.get('vendorId'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      search: searchParams.get('search'),
      documentType: searchParams.get('documentType'),
      overdue: searchParams.get('overdue'),
    });

    // Build where clause
    const where: any = {
      companyId: user.companyId,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.vendorId) {
      where.vendorId = query.vendorId;
    }

    if (query.documentType) {
      where.documentType = query.documentType;
    }

    if (query.startDate && query.endDate) {
      where.billDate = {
        [Op.between]: [new Date(query.startDate), new Date(query.endDate)],
      };
    }

    if (query.overdue) {
      where.dueDate = {
        [Op.lt]: new Date(),
      };
      where.status = {
        [Op.notIn]: ['paid', 'cancelled'],
      };
    }

    if (query.search) {
      where[Op.or] = [
        { billNumber: { [Op.iLike]: `%${query.search}%` } },
        { vendorInvoiceNumber: { [Op.iLike]: `%${query.search}%` } },
        { referenceNumber: { [Op.iLike]: `%${query.search}%` } },
        { description: { [Op.iLike]: `%${query.search}%` } },
      ];
    }

    // Pagination
    const limit = query.limit;
    const offset = (query.page - 1) * limit;

    // Fetch bills with count
    const { count, rows: bills } = await Bill.findAndCountAll({
      where,
      include: [
        {
          model: Vendor,
          as: 'vendor',
          attributes: ['id', 'vendorNumber', 'vendorName'],
        },
        {
          model: BillLine,
          as: 'lines',
          attributes: ['id', 'lineNumber', 'itemName', 'quantity', 'unitPrice', 'totalAmount'],
        },
      ],
      order: [['billDate', 'DESC'], ['createdAt', 'DESC']],
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      bills,
      pagination: {
        page: query.page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    logger.error('Error listing bills', { error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// POST /api/ap/bills - Create bill
export async function POST(req: NextRequest) {
  let transaction: any = null;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    // Check permission
    if (!hasPermission(user, 'ap.bills.create')) {
      throw createPermissionError('Insufficient permissions to create bills');
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = createBillSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      throw createValidationError(firstError.message, firstError.path.join('.'));
    }

    const data = validation.data;

    // Start transaction
    transaction = await sequelize.transaction();

    // Verify vendor exists
    const vendor = await Vendor.findOne({
      where: {
        id: data.vendorId,
        companyId: user.companyId,
      },
      transaction,
    });

    if (!vendor) {
      throw createValidationError('Vendor not found', 'vendorId');
    }

    if (vendor.status === 'blocked') {
      throw createValidationError('Vendor is blocked', 'vendorId');
    }

    // Verify AP account exists
    const apAccount = await ChartOfAccount.findOne({
      where: {
        id: data.apAccountId,
        companyId: user.companyId,
      },
      transaction,
    });

    if (!apAccount) {
      throw createValidationError('AP account not found', 'apAccountId');
    }

    // Generate bill number
    const billNumber = await generateBillNumber(user.companyId, transaction);

    // Calculate amounts from lines
    let calculatedSubtotal = 0;
    let calculatedTax = 0;
    let calculatedDiscount = 0;

    for (const line of data.lines) {
      const lineAmount = line.quantity * line.unitPrice;
      const lineDiscount = (lineAmount * line.discountPercent) / 100;
      const lineAfterDiscount = lineAmount - lineDiscount;
      const lineTax = (lineAfterDiscount * line.taxRate) / 100;

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

    // Calculate due date if not provided
    const billDate = new Date(data.billDate);
    const dueDate = data.dueDate
      ? new Date(data.dueDate)
      : new Date(billDate.getTime() + (data.paymentTermDays || vendor.paymentTermDays) * 24 * 60 * 60 * 1000);

    // Calculate discount due date if applicable
    const discountDueDate =
      data.earlyPaymentDiscount || vendor.earlyPaymentDiscount
        ? new Date(billDate.getTime() + 10 * 24 * 60 * 60 * 1000) // Typically 10 days for early payment discount
        : null;

    // Create bill
    const bill = await Bill.create(
      {
        companyId: user.companyId,
        vendorId: data.vendorId,
        billNumber,
        vendorInvoiceNumber: data.vendorInvoiceNumber,
        referenceNumber: data.referenceNumber || null,
        purchaseOrderId: data.purchaseOrderId || null,
        documentType: data.documentType,
        status: data.requiresApproval ? 'pending_approval' : 'draft',
        billDate: billDate,
        dueDate: dueDate,
        postingDate: null,
        receivedDate: data.receivedDate ? new Date(data.receivedDate) : null,
        currencyCode: data.currencyCode,
        exchangeRate: data.exchangeRate,
        subtotalAmount: calculatedSubtotal,
        taxAmount: calculatedTax,
        discountAmount: calculatedDiscount,
        shippingAmount: data.shippingAmount,
        otherCharges: data.otherCharges,
        totalAmount,
        paidAmount: 0,
        outstandingAmount: totalAmount,
        apAccountId: data.apAccountId,
        journalEntryId: null,
        isPosted: false,
        requiresApproval: data.requiresApproval,
        approvedBy: null,
        approvedAt: null,
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: null,
        paymentTerms: data.paymentTerms || vendor.paymentTerms,
        paymentTermDays: data.paymentTermDays || vendor.paymentTermDays,
        earlyPaymentDiscount: data.earlyPaymentDiscount || vendor.earlyPaymentDiscount,
        discountDueDate,
        description: data.description || null,
        notes: data.notes || null,
        internalNotes: data.internalNotes || null,
        attachments: [],
        tags: data.tags,
        isReconciled: false,
        reconciledBy: null,
        reconciledAt: null,
        goodsReceiptId: null,
        createdBy: user.id,
        updatedBy: user.id,
      },
      { transaction }
    );

    // Create bill lines
    const lines = [];
    for (let i = 0; i < data.lines.length; i++) {
      const lineData = data.lines[i];

      // Get expense account details
      const expenseAccount = await ChartOfAccount.findByPk(lineData.expenseAccountId, { transaction });
      if (!expenseAccount) {
        throw createValidationError(`Expense account not found: ${lineData.expenseAccountId}`, 'lines');
      }

      if (!expenseAccount.isActive) {
        throw createValidationError(`Expense account is inactive: ${expenseAccount.code}`, 'lines');
      }

      const lineAmount = lineData.quantity * lineData.unitPrice;
      const lineDiscount = (lineAmount * lineData.discountPercent) / 100;
      const lineAfterDiscount = lineAmount - lineDiscount;
      const lineTax = (lineAfterDiscount * lineData.taxRate) / 100;
      const lineTotal = lineAfterDiscount + lineTax;

      const line = await BillLine.create(
        {
          companyId: user.companyId,
          billId: bill.id,
          lineNumber: i + 1,
          itemType: lineData.itemType,
          itemCode: lineData.itemCode || null,
          itemName: lineData.itemName,
          description: lineData.description || null,
          expenseAccountId: expenseAccount.id,
          accountCode: expenseAccount.code,
          accountName: expenseAccount.name,
          quantity: lineData.quantity,
          unitOfMeasure: lineData.unitOfMeasure,
          unitPrice: lineData.unitPrice,
          lineAmount,
          taxCode: lineData.taxCode || null,
          taxRate: lineData.taxRate,
          taxAmount: lineTax,
          discountPercent: lineData.discountPercent,
          discountAmount: lineDiscount,
          totalAmount: lineTotal,
          costCenterId: lineData.costCenterId || null,
          projectId: lineData.projectId || null,
          departmentId: lineData.departmentId || null,
          purchaseOrderLineId: null,
          goodsReceiptLineId: null,
          notes: lineData.notes || null,
        },
        { transaction }
      );

      lines.push(line);
    }

    // If autoPost is true and no approval required, approve immediately
    if (data.autoPost && !data.requiresApproval) {
      await bill.update(
        {
          status: 'approved',
          approvedBy: user.id,
          approvedAt: new Date(),
        },
        { transaction }
      );
    }

    await transaction.commit();

    logger.info('Bill created', {
      billId: bill.id,
      billNumber: bill.billNumber,
      vendorId: vendor.id,
      totalAmount,
      userId: user.id,
    });

    return NextResponse.json(
      {
        success: true,
        bill,
        lines,
      },
      { status: 201 }
    );
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    logger.error('Error creating bill', { error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// Helper function to generate bill number
async function generateBillNumber(companyId: string, transaction: any): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `BILL-${year}-`;

  // Get the last bill number for this year
  const lastBill = await Bill.findOne({
    where: {
      companyId,
      billNumber: {
        [Op.like]: `${prefix}%`,
      },
    },
    order: [['createdAt', 'DESC']],
    transaction,
  });

  let nextNumber = 1;
  if (lastBill) {
    const lastNumberStr = lastBill.billNumber.replace(prefix, '');
    const lastNumber = parseInt(lastNumberStr, 10);
    nextNumber = lastNumber + 1;
  }

  // Pad with zeros to 5 digits
  const paddedNumber = nextNumber.toString().padStart(5, '0');
  return `${prefix}${paddedNumber}`;
}
