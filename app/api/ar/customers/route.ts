import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Customer } from '@/lib/db/models';
import { createCustomerSchema, listCustomersQuerySchema } from '@/lib/validators/ar';
import { createValidationError, formatErrorResponse, createPermissionError } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';
import { Op } from 'sequelize';

// GET /api/ar/customers - List customers
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    // Check permission
    if (!hasPermission(user, 'ar.customers.view')) {
      throw createPermissionError('Insufficient permissions to view customers');
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const query = listCustomersQuerySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      status: searchParams.get('status'),
      customerType: searchParams.get('customerType'),
      customerCategory: searchParams.get('customerCategory'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    });

    // Build where clause
    const where: any = {
      companyId: user.companyId,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.customerType) {
      where.customerType = query.customerType;
    }

    if (query.customerCategory) {
      where.customerCategory = query.customerCategory;
    }

    if (query.search) {
      where[Op.or] = [
        { customerCode: { [Op.iLike]: `%${query.search}%` } },
        { customerName: { [Op.iLike]: `%${query.search}%` } },
        { displayName: { [Op.iLike]: `%${query.search}%` } },
        { email: { [Op.iLike]: `%${query.search}%` } },
        { phone: { [Op.iLike]: `%${query.search}%` } },
      ];
    }

    // Pagination
    const limit = query.limit;
    const offset = (query.page - 1) * limit;

    // Determine sort field
    let orderField = 'customerName';
    if (query.sortBy === 'code') orderField = 'customerCode';
    if (query.sortBy === 'balance') orderField = 'currentBalance';
    if (query.sortBy === 'lastSale') orderField = 'lastSaleDate';

    // Fetch customers with count
    const { count, rows: customers } = await Customer.findAndCountAll({
      where,
      order: [[orderField, query.sortOrder.toUpperCase()]],
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      customers,
      pagination: {
        page: query.page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    logger.error('Error listing customers', { error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// POST /api/ar/customers - Create customer
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    // Check permission
    if (!hasPermission(user, 'ar.customers.create')) {
      throw createPermissionError('Insufficient permissions to create customers');
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = createCustomerSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      throw createValidationError(firstError.message, firstError.path.join('.'));
    }

    const data = validation.data;

    // Generate customer code
    const customerCode = await generateCustomerCode(user.companyId);

    // Create customer
    const customer = await Customer.create({
      companyId: user.companyId,
      customerCode,
      customerName: data.customerName,
      legalName: data.legalName,
      displayName: data.displayName,
      businessType: data.businessType,
      taxId: data.taxId || null,
      registrationNumber: data.registrationNumber || null,
      industryType: data.industryType || null,

      email: data.email,
      phone: data.phone,
      fax: data.fax || null,
      website: data.website || null,

      contactPersonName: data.contactPersonName || null,
      contactPersonEmail: data.contactPersonEmail || null,
      contactPersonPhone: data.contactPersonPhone || null,
      contactPersonPosition: data.contactPersonPosition || null,

      billingAddressLine1: data.billingAddressLine1,
      billingAddressLine2: data.billingAddressLine2 || null,
      billingCity: data.billingCity,
      billingState: data.billingState,
      billingCountry: data.billingCountry,
      billingPostalCode: data.billingPostalCode,

      sameAsBillingAddress: data.sameAsBillingAddress,
      shippingAddressLine1: data.sameAsBillingAddress ? data.billingAddressLine1 : (data.shippingAddressLine1 || null),
      shippingAddressLine2: data.sameAsBillingAddress ? data.billingAddressLine2 : (data.shippingAddressLine2 || null),
      shippingCity: data.sameAsBillingAddress ? data.billingCity : (data.shippingCity || null),
      shippingState: data.sameAsBillingAddress ? data.billingState : (data.shippingState || null),
      shippingCountry: data.sameAsBillingAddress ? data.billingCountry : (data.shippingCountry || null),
      shippingPostalCode: data.sameAsBillingAddress ? data.billingPostalCode : (data.shippingPostalCode || null),

      currencyCode: data.currencyCode,
      paymentTerms: data.paymentTerms,
      paymentTermDays: data.paymentTermDays,
      creditLimit: data.creditLimit,
      currentBalance: 0,

      defaultARAccountId: data.defaultARAccountId,
      defaultRevenueAccountId: data.defaultRevenueAccountId || null,

      bankName: data.bankName || null,
      bankAccountNumber: data.bankAccountNumber || null,
      bankAccountName: data.bankAccountName || null,
      bankBranch: data.bankBranch || null,

      isTaxable: data.isTaxable,
      taxRegistrationNumber: data.taxRegistrationNumber || null,
      defaultTaxRate: data.defaultTaxRate,
      taxExemptReason: data.taxExemptReason || null,

      customerType: data.customerType,
      customerCategory: data.customerCategory || null,
      customerGroup: data.customerGroup || null,
      salesPersonId: data.salesPersonId || null,

      status: 'active',
      rating: 0,
      notes: data.notes || null,
      internalNotes: data.internalNotes || null,

      totalSales: 0,
      totalCollected: 0,
      averageCollectionDays: 0,
      lastSaleDate: null,
      lastPaymentDate: null,

      isKeyAccount: data.isKeyAccount,
      allowCreditSales: data.allowCreditSales,
      autoEmailInvoices: data.autoEmailInvoices,
      autoEmailStatements: data.autoEmailStatements,

      discountPercent: data.discountPercent,

      createdBy: user.id,
      updatedBy: user.id,
    });

    logger.info('Customer created', {
      customerId: customer.id,
      customerCode: customer.customerCode,
      customerName: customer.customerName,
      userId: user.id,
    });

    return NextResponse.json(
      {
        success: true,
        customer,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error creating customer', { error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// Helper function to generate customer code
async function generateCustomerCode(companyId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CUST-${year}-`;

  // Get the last customer code for this year
  const lastCustomer = await Customer.findOne({
    where: {
      companyId,
      customerCode: {
        [Op.like]: `${prefix}%`,
      },
    },
    order: [['createdAt', 'DESC']],
  });

  let nextNumber = 1;
  if (lastCustomer) {
    const lastNumberStr = lastCustomer.customerCode.replace(prefix, '');
    const lastNumber = parseInt(lastNumberStr, 10);
    nextNumber = lastNumber + 1;
  }

  // Pad with zeros to 5 digits
  const paddedNumber = nextNumber.toString().padStart(5, '0');
  return `${prefix}${paddedNumber}`;
}
