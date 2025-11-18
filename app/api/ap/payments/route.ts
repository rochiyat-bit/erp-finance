import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BillPayment, PaymentAllocation, Vendor, Bill, ChartOfAccount } from '@/lib/db/models';
import { createPaymentSchema, listPaymentsQuerySchema } from '@/lib/validators/ap';
import { createValidationError, formatErrorResponse, createPermissionError } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';
import { Op } from 'sequelize';
import sequelize from '@/lib/db/sequelize';

// GET /api/ap/payments - List payments
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    // Check permission
    if (!hasPermission(user, 'ap.payments.view')) {
      throw createPermissionError('Insufficient permissions to view payments');
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const query = listPaymentsQuerySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      status: searchParams.get('status'),
      vendorId: searchParams.get('vendorId'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      search: searchParams.get('search'),
      paymentMethod: searchParams.get('paymentMethod'),
      uncleared: searchParams.get('uncleared'),
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

    if (query.paymentMethod) {
      where.paymentMethod = query.paymentMethod;
    }

    if (query.startDate && query.endDate) {
      where.paymentDate = {
        [Op.between]: [new Date(query.startDate), new Date(query.endDate)],
      };
    }

    if (query.uncleared) {
      where.isCleared = false;
    }

    if (query.search) {
      where[Op.or] = [
        { paymentNumber: { [Op.iLike]: `%${query.search}%` } },
        { referenceNumber: { [Op.iLike]: `%${query.search}%` } },
        { checkNumber: { [Op.iLike]: `%${query.search}%` } },
        { description: { [Op.iLike]: `%${query.search}%` } },
      ];
    }

    // Pagination
    const limit = query.limit;
    const offset = (query.page - 1) * limit;

    // Fetch payments with count
    const { count, rows: payments } = await BillPayment.findAndCountAll({
      where,
      include: [
        {
          model: Vendor,
          as: 'vendor',
          attributes: ['id', 'vendorNumber', 'vendorName'],
        },
        {
          model: PaymentAllocation,
          as: 'allocations',
          include: [
            {
              model: Bill,
              as: 'bill',
              attributes: ['id', 'billNumber', 'billDate', 'totalAmount'],
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

// POST /api/ap/payments - Create payment
export async function POST(req: NextRequest) {
  let transaction: any = null;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    // Check permission
    if (!hasPermission(user, 'ap.payments.create')) {
      throw createPermissionError('Insufficient permissions to create payments');
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = createPaymentSchema.safeParse(body);

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

    // Verify bank account exists
    const bankAccount = await ChartOfAccount.findOne({
      where: {
        id: data.bankAccountId,
        companyId: user.companyId,
      },
      transaction,
    });

    if (!bankAccount) {
      throw createValidationError('Bank account not found', 'bankAccountId');
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

    // Generate payment number
    const paymentNumber = await generatePaymentNumber(user.companyId, transaction);

    // Calculate allocated and unapplied amounts
    let totalAllocated = 0;
    if (data.allocations && data.allocations.length > 0) {
      totalAllocated = data.allocations.reduce(
        (sum, alloc) => sum + alloc.allocationAmount + alloc.discountTaken + alloc.writeOffAmount,
        0
      );
    }

    const unappliedAmount = data.paymentAmount - totalAllocated;

    // Create payment
    const payment = await BillPayment.create(
      {
        companyId: user.companyId,
        vendorId: data.vendorId,
        paymentNumber,
        referenceNumber: data.referenceNumber || null,
        checkNumber: data.checkNumber || null,
        paymentDate: new Date(data.paymentDate),
        postingDate: null,
        paymentMethod: data.paymentMethod,
        status: data.requiresApproval ? 'pending' : 'draft',
        isPosted: false,
        isCleared: false,
        clearedDate: null,
        currencyCode: data.currencyCode,
        exchangeRate: data.exchangeRate,
        paymentAmount: data.paymentAmount,
        allocatedAmount: 0,
        unappliedAmount: data.paymentAmount,
        bankAccountId: data.bankAccountId,
        bankAccountCode: bankAccount.code,
        bankAccountName: bankAccount.name,
        apAccountId: data.apAccountId,
        journalEntryId: null,
        requiresApproval: data.requiresApproval,
        approvedBy: null,
        approvedAt: null,
        description: data.description || null,
        notes: data.notes || null,
        internalNotes: data.internalNotes || null,
        attachments: [],
        payeeName: data.payeeName,
        payeeAddress: data.payeeAddress || null,
        createdBy: user.id,
        updatedBy: user.id,
      },
      { transaction }
    );

    // Create payment allocations
    const allocations = [];
    if (data.allocations && data.allocations.length > 0) {
      for (const allocData of data.allocations) {
        // Verify bill exists and is posted
        const bill = await Bill.findOne({
          where: {
            id: allocData.billId,
            companyId: user.companyId,
            vendorId: data.vendorId,
          },
          transaction,
        });

        if (!bill) {
          throw createValidationError(`Bill not found: ${allocData.billId}`, 'allocations');
        }

        if (!bill.isPosted) {
          throw createValidationError(`Bill must be posted before payment can be allocated: ${bill.billNumber}`, 'allocations');
        }

        // Check outstanding amount
        const totalApplied = allocData.allocationAmount + allocData.discountTaken + allocData.writeOffAmount;
        if (totalApplied > Number(bill.outstandingAmount)) {
          throw createValidationError(
            `Allocation amount exceeds outstanding balance for bill ${bill.billNumber}`,
            'allocations'
          );
        }

        const allocation = await PaymentAllocation.create(
          {
            companyId: user.companyId,
            billPaymentId: payment.id,
            billId: allocData.billId,
            allocationAmount: allocData.allocationAmount,
            discountTaken: allocData.discountTaken,
            writeOffAmount: allocData.writeOffAmount,
            totalApplied,
            discountAccountId: allocData.discountAccountId || null,
            writeOffAccountId: allocData.writeOffAccountId || null,
            allocationDate: new Date(data.paymentDate),
            isVoided: false,
            voidedBy: null,
            voidedAt: null,
            voidReason: null,
            notes: allocData.notes || null,
            createdBy: user.id,
            updatedBy: user.id,
          },
          { transaction }
        );

        allocations.push(allocation);
      }
    }

    // If autoPost is true and no approval required, approve immediately
    if (data.autoPost && !data.requiresApproval) {
      await payment.update(
        {
          status: 'approved',
          approvedBy: user.id,
          approvedAt: new Date(),
        },
        { transaction }
      );
    }

    await transaction.commit();

    logger.info('Payment created', {
      paymentId: payment.id,
      paymentNumber: payment.paymentNumber,
      vendorId: vendor.id,
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
  const prefix = `PAY-${year}-`;

  // Get the last payment number for this year
  const lastPayment = await BillPayment.findOne({
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
