import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SalesOrder, SalesOrderLine, Customer, ChartOfAccount } from '@/lib/db/models';
import { createSalesOrderSchema, listSalesOrdersQuerySchema } from '@/lib/validators/ar';
import { createValidationError, formatErrorResponse, createPermissionError } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';
import { Op } from 'sequelize';
import sequelize from '@/lib/db/sequelize';

// GET /api/ar/sales-orders - List sales orders
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    // Check permission
    if (!hasPermission(user, 'ar.sales_orders.view')) {
      throw createPermissionError('Insufficient permissions to view sales orders');
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const query = listSalesOrdersQuerySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      status: searchParams.get('status'),
      customerId: searchParams.get('customerId'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      search: searchParams.get('search'),
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

    if (query.startDate && query.endDate) {
      where.soDate = {
        [Op.between]: [new Date(query.startDate), new Date(query.endDate)],
      };
    }

    if (query.search) {
      where[Op.or] = [
        { soNumber: { [Op.iLike]: `%${query.search}%` } },
        { customerName: { [Op.iLike]: `%${query.search}%` } },
        { customerPO: { [Op.iLike]: `%${query.search}%` } },
        { description: { [Op.iLike]: `%${query.search}%` } },
      ];
    }

    // Pagination
    const limit = query.limit;
    const offset = (query.page - 1) * limit;

    // Fetch sales orders with count
    const { count, rows: salesOrders } = await SalesOrder.findAndCountAll({
      where,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customerCode', 'customerName', 'email', 'phone'],
        },
        {
          model: SalesOrderLine,
          as: 'lines',
        },
      ],
      order: [['soDate', 'DESC'], ['createdAt', 'DESC']],
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      salesOrders,
      pagination: {
        page: query.page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    logger.error('Error listing sales orders', { error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// POST /api/ar/sales-orders - Create sales order
export async function POST(req: NextRequest) {
  let transaction: any = null;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    // Check permission
    if (!hasPermission(user, 'ar.sales_orders.create')) {
      throw createPermissionError('Insufficient permissions to create sales orders');
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = createSalesOrderSchema.safeParse(body);

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

    // Generate SO number
    const soNumber = await generateSONumber(user.companyId, transaction);

    // Calculate totals from lines
    let calculatedSubtotal = 0;
    let calculatedTax = 0;

    for (const line of data.lines) {
      const lineAmount = line.quantity * line.unitPrice;
      const lineDiscount = (lineAmount * line.discountPercent) / 100;
      const lineAfterDiscount = lineAmount - lineDiscount;
      const lineTax = (lineAfterDiscount * line.taxPercent) / 100;

      calculatedSubtotal += lineAmount;
      calculatedTax += lineTax;
    }

    const subtotalAmount = calculatedSubtotal;
    const discountAmount = data.discountAmount || 0;
    const taxAmount = calculatedTax;
    const shippingAmount = data.shippingAmount || 0;
    const otherCharges = data.otherCharges || 0;
    const totalAmount = subtotalAmount - discountAmount + taxAmount + shippingAmount + otherCharges;

    // Create sales order
    const salesOrder = await SalesOrder.create(
      {
        companyId: user.companyId,
        soNumber,
        customerId: data.customerId,
        customerName: customer.customerName,
        customerPO: data.customerPO || null,

        soDate: new Date(data.soDate),
        requiredDate: data.requiredDate ? new Date(data.requiredDate) : null,
        promisedDate: data.promisedDate ? new Date(data.promisedDate) : null,

        currencyCode: data.currencyCode,
        exchangeRate: data.exchangeRate,

        subtotalAmount,
        discountAmount,
        taxAmount,
        shippingAmount,
        otherCharges,
        totalAmount,

        status: 'draft',

        requiresApproval: data.requiresApproval || false,
        approvedBy: null,
        approvedAt: null,

        shippingMethodId: data.shippingMethodId || null,
        shippingAddress: data.shippingAddress || null,
        billingAddress: data.billingAddress || null,

        salesPersonId: data.salesPersonId || null,
        salesTeamId: data.salesTeamId || null,
        salesChannelId: data.salesChannelId || null,

        deliveredQuantity: 0,
        deliveredAmount: 0,
        isFullyDelivered: false,

        invoicedQuantity: 0,
        invoicedAmount: 0,
        isFullyInvoiced: false,

        isClosed: false,
        closedBy: null,
        closedAt: null,
        closeReason: null,

        isCancelled: false,
        cancelledBy: null,
        cancelledAt: null,
        cancellationReason: null,

        description: data.description || null,
        notes: data.notes || null,
        internalNotes: data.internalNotes || null,

        createdBy: user.id,
        updatedBy: user.id,
      },
      { transaction }
    );

    // Create sales order lines
    const lines = [];
    for (let i = 0; i < data.lines.length; i++) {
      const lineData = data.lines[i];

      // Verify revenue account if provided
      let revenueAccount = null;
      if (lineData.revenueAccountId) {
        revenueAccount = await ChartOfAccount.findOne({
          where: {
            id: lineData.revenueAccountId,
            companyId: user.companyId,
          },
          transaction,
        });

        if (!revenueAccount) {
          throw createValidationError(
            `Revenue account not found for line ${i + 1}`,
            `lines.${i}.revenueAccountId`
          );
        }
      }

      const lineAmount = lineData.quantity * lineData.unitPrice;
      const discountAmount = (lineAmount * lineData.discountPercent) / 100;
      const taxableAmount = lineAmount - discountAmount;
      const taxAmount = (taxableAmount * lineData.taxPercent) / 100;
      const lineTotal = taxableAmount + taxAmount;

      const line = await SalesOrderLine.create(
        {
          companyId: user.companyId,
          salesOrderId: salesOrder.id,
          lineNumber: i + 1,

          productId: lineData.productId || null,
          itemName: lineData.itemName,
          description: lineData.description || null,

          quantity: lineData.quantity,
          unitPrice: lineData.unitPrice,
          unitOfMeasure: lineData.unitOfMeasure || 'each',

          discountPercent: lineData.discountPercent,
          discountAmount,

          taxPercent: lineData.taxPercent,
          taxAmount,
          taxCodeId: lineData.taxCodeId || null,

          lineTotal,

          revenueAccountId: revenueAccount?.id || null,
          revenueAccountCode: revenueAccount?.code || null,

          deliveredQuantity: 0,
          invoicedQuantity: 0,

          notes: lineData.notes || null,
        },
        { transaction }
      );

      lines.push(line);
    }

    // Auto-approve if requested and doesn't require approval
    if (data.autoApprove && !salesOrder.requiresApproval) {
      await salesOrder.update(
        {
          status: 'approved',
          approvedBy: user.id,
          approvedAt: new Date(),
        },
        { transaction }
      );
    }

    await transaction.commit();

    logger.info('Sales order created', {
      salesOrderId: salesOrder.id,
      soNumber: salesOrder.soNumber,
      customerId: customer.id,
      totalAmount,
      userId: user.id,
    });

    return NextResponse.json(
      {
        success: true,
        salesOrder,
        lines,
      },
      { status: 201 }
    );
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    logger.error('Error creating sales order', { error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// Helper function to generate SO number
async function generateSONumber(companyId: string, transaction: any): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `SO-${year}-`;

  // Get the last SO number for this year
  const lastSO = await SalesOrder.findOne({
    where: {
      companyId,
      soNumber: {
        [Op.like]: `${prefix}%`,
      },
    },
    order: [['createdAt', 'DESC']],
    transaction,
  });

  let nextNumber = 1;
  if (lastSO) {
    const lastNumberStr = lastSO.soNumber.replace(prefix, '');
    const lastNumber = parseInt(lastNumberStr, 10);
    nextNumber = lastNumber + 1;
  }

  // Pad with zeros to 5 digits
  const paddedNumber = nextNumber.toString().padStart(5, '0');
  return `${prefix}${paddedNumber}`;
}
