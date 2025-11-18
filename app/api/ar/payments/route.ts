import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CustomerPayment, CustomerPaymentAllocation, Customer, Invoice, ChartOfAccount } from '@/lib/db/models';
import { createCustomerPaymentSchema, listCustomerPaymentsQuerySchema } from '@/lib/validators/ar';
import { createValidationError, formatErrorResponse, createPermissionError } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';
import { Op } from 'sequelize';
import sequelize from '@/lib/db/sequelize';

// GET /api/ar/payments - List payments
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    // Check permission
    if (!hasPermission(user, 'ar.payments.view')) {
      throw createPermissionError('Insufficient permissions to view payments');
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const query = listCustomerPaymentsQuerySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      status: searchParams.get('status'),
      customerId: searchParams.get('customerId'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      search: searchParams.get('search'),
      paymentMethod: searchParams.get('paymentMethod'),
    });

    // Build where clause
    const where: any = {
      companyId: user.companyId,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.customerId) {
      where.customerId = query.customerId;
    }

    if (query.paymentMethod) {
      where.paymentMethod = query.paymentMethod;
    }

    if (query.startDate && query.endDate) {
      where.paymentDate = {
        [Op.between]: [new Date(query.startDate), new Date(query.endDate)],
      };
    }

    if (query.search) {
      where[Op.or] = [
        { paymentNumber: { [Op.iLike]: `%${query.search}%` } },
        { customerName: { [Op.iLike]: `%${query.search}%` } },
        { referenceNumber: { [Op.iLike]: `%${query.search}%` } },
        { description: { [Op.iLike]: `%${query.search}%` } },
      ];
    }

    // Pagination
    const limit = query.limit;
    const offset = (query.page - 1) * limit;

    // Fetch payments with count
    const { count, rows: payments } = await CustomerPayment.findAndCountAll({
      where,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customerCode', 'customerName'],
        },
        {
          model: CustomerPaymentAllocation,
          as: 'allocations',
          include: [
            {
              model: Invoice,
              as: 'invoice',
              attributes: ['id', 'invoiceNumber', 'totalAmount'],
            },
          ],
        },
      ],
      order: [['paymentDate', 'DESC'], ['createdAt', 'DESC']],
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      payments,
      pagination: {
        page: query.page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    logger.error('Error listing payments', { error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// POST /api/ar/payments - Create payment
export async function POST(req: NextRequest) {
  let transaction: any = null;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    // Check permission
    if (!hasPermission(user, 'ar.payments.create')) {
      throw createPermissionError('Insufficient permissions to create payments');
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = createCustomerPaymentSchema.safeParse(body);

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

    // Get bank account if provided
    let bankAccount = null;
    if (data.bankAccountId) {
      bankAccount = await ChartOfAccount.findOne({
        where: {
          id: data.bankAccountId,
          companyId: user.companyId,
        },
        transaction,
      });

      if (!bankAccount) {
        throw createValidationError('Bank account not found', 'bankAccountId');
      }
    }

    // Generate payment number
    const paymentNumber = await generatePaymentNumber(user.companyId, transaction);

    // Calculate allocated and unapplied amounts
    let totalAllocated = 0;
    if (data.allocations && data.allocations.length > 0) {
      totalAllocated = data.allocations.reduce(
        (sum, alloc) => sum + alloc.allocatedAmount + alloc.discountGiven,
        0
      );
    }

    const unappliedAmount = data.paymentAmount - totalAllocated;

    // Create payment
    const payment = await CustomerPayment.create(
      {
        companyId: user.companyId,
        paymentNumber,
        referenceNumber: data.referenceNumber || null,
        checkNumber: data.checkNumber || null,
        transactionId: data.transactionId || null,

        customerId: data.customerId,
        customerName: customer.customerName,

        paymentDate: new Date(data.paymentDate),
        paymentMethod: data.paymentMethod,

        bankAccountId: bankAccount?.id || null,
        bankAccountCode: bankAccount?.code || null,
        bankAccountName: bankAccount?.name || null,

        currencyCode: data.currencyCode,
        exchangeRate: data.exchangeRate,
        paymentAmount: data.paymentAmount,

        allocatedAmount: 0,
        unappliedAmount: data.paymentAmount,

        status: 'draft',

        isPosted: false,
        postedAt: null,
        postedBy: null,
        journalEntryId: null,

        description: data.description || null,
        notes: data.notes || null,

        createdBy: user.id,
        updatedBy: user.id,

        isVoid: false,
        voidedAt: null,
        voidedBy: null,
        voidReason: null,
      },
      { transaction }
    );

    // Create payment allocations
    const allocations = [];
    if (data.allocations && data.allocations.length > 0) {
      for (const allocData of data.allocations) {
        // Verify invoice exists and is posted
        const invoice = await Invoice.findOne({
          where: {
            id: allocData.invoiceId,
            companyId: user.companyId,
            customerId: data.customerId,
          },
          transaction,
        });

        if (!invoice) {
          throw createValidationError(`Invoice not found: ${allocData.invoiceId}`, 'allocations');
        }

        if (!invoice.isPosted) {
          throw createValidationError(`Invoice must be posted before payment: ${invoice.invoiceNumber}`, 'allocations');
        }

        if (invoice.isVoid) {
          throw createValidationError(`Cannot pay voided invoice: ${invoice.invoiceNumber}`, 'allocations');
        }

        // Check outstanding amount
        const totalApplied = allocData.allocatedAmount + allocData.discountGiven;
        if (totalApplied > Number(invoice.balanceAmount)) {
          throw createValidationError(
            `Allocation amount exceeds outstanding balance for invoice ${invoice.invoiceNumber}`,
            'allocations'
          );
        }

        const allocation = await CustomerPaymentAllocation.create(
          {
            companyId: user.companyId,
            customerPaymentId: payment.id,
            invoiceId: allocData.invoiceId,
            allocatedAmount: allocData.allocatedAmount,
            discountGiven: allocData.discountGiven,
            invoiceNumber: invoice.invoiceNumber,
            invoiceTotalAmount: invoice.totalAmount,
            invoiceBalanceBefore: invoice.balanceAmount,
            invoiceBalanceAfter: Number(invoice.balanceAmount) - totalApplied,
          },
          { transaction }
        );

        allocations.push(allocation);
      }
    }

    // If autoPost is true, approve immediately
    if (data.autoPost) {
      await payment.update(
        {
          status: 'approved',
        },
        { transaction }
      );
    }

    await transaction.commit();

    logger.info('Payment created', {
      paymentId: payment.id,
      paymentNumber: payment.paymentNumber,
      customerId: customer.id,
      paymentAmount: data.paymentAmount,
      userId: user.id,
    });

    return NextResponse.json(
      {
        success: true,
        payment,
        allocations,
      },
      { status: 201 }
    );
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    logger.error('Error creating payment', { error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// Helper function to generate payment number
async function generatePaymentNumber(companyId: string, transaction: any): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `RCP-${year}-`;

  // Get the last payment number for this year
  const lastPayment = await CustomerPayment.findOne({
    where: {
      companyId,
      paymentNumber: {
        [Op.like]: `${prefix}%`,
      },
    },
    order: [['createdAt', 'DESC']],
    transaction,
  });

  let nextNumber = 1;
  if (lastPayment) {
    const lastNumberStr = lastPayment.paymentNumber.replace(prefix, '');
    const lastNumber = parseInt(lastNumberStr, 10);
    nextNumber = lastNumber + 1;
  }

  // Pad with zeros to 5 digits
  const paddedNumber = nextNumber.toString().padStart(5, '0');
  return `${prefix}${paddedNumber}`;
}
