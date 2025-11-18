import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Vendor } from '@/lib/db/models';
import { createVendorSchema, listVendorsQuerySchema } from '@/lib/validators/ap';
import { createValidationError, formatErrorResponse, createPermissionError } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';
import { Op } from 'sequelize';

// GET /api/ap/vendors - List vendors
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    // Check permission
    if (!hasPermission(user, 'ap.vendors.view')) {
      throw createPermissionError('Insufficient permissions to view vendors');
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const query = listVendorsQuerySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      status: searchParams.get('status'),
      search: searchParams.get('search'),
      vendorType: searchParams.get('vendorType'),
    });

    // Build where clause
    const where: any = {
      companyId: user.companyId,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.vendorType) {
      where.vendorType = query.vendorType;
    }

    if (query.search) {
      where[Op.or] = [
        { vendorNumber: { [Op.iLike]: `%${query.search}%` } },
        { vendorName: { [Op.iLike]: `%${query.search}%` } },
        { email: { [Op.iLike]: `%${query.search}%` } },
        { phone: { [Op.iLike]: `%${query.search}%` } },
      ];
    }

    // Pagination
    const limit = query.limit;
    const offset = (query.page - 1) * limit;

    // Fetch vendors with count
    const { count, rows: vendors } = await Vendor.findAndCountAll({
      where,
      order: [['vendorName', 'ASC']],
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      vendors,
      pagination: {
        page: query.page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    logger.error('Error listing vendors', { error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// POST /api/ap/vendors - Create vendor
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    // Check permission
    if (!hasPermission(user, 'ap.vendors.create')) {
      throw createPermissionError('Insufficient permissions to create vendors');
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = createVendorSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      throw createValidationError(firstError.message, firstError.path.join('.'));
    }

    const data = validation.data;

    // Generate vendor number
    const vendorNumber = await generateVendorNumber(user.companyId);

    // Create vendor
    const vendor = await Vendor.create({
      companyId: user.companyId,
      vendorNumber,
      vendorName: data.vendorName,
      vendorType: data.vendorType,
      taxId: data.taxId || null,
      registrationNumber: data.registrationNumber || null,
      contactPerson: data.contactPerson || null,
      email: data.email || null,
      phone: data.phone || null,
      mobile: data.mobile || null,
      website: data.website || null,
      billingAddress: data.billingAddress || null,
      billingCity: data.billingCity || null,
      billingState: data.billingState || null,
      billingPostalCode: data.billingPostalCode || null,
      billingCountry: data.billingCountry || null,
      shippingAddress: data.shippingAddress || null,
      shippingCity: data.shippingCity || null,
      shippingState: data.shippingState || null,
      shippingPostalCode: data.shippingPostalCode || null,
      shippingCountry: data.shippingCountry || null,
      currencyCode: data.currencyCode,
      paymentTerms: data.paymentTerms,
      paymentTermDays: data.paymentTermDays,
      earlyPaymentDiscount: data.earlyPaymentDiscount,
      creditLimit: data.creditLimit,
      apAccountId: data.apAccountId || null,
      expenseAccountId: data.expenseAccountId || null,
      bankName: data.bankName || null,
      bankAccountNumber: data.bankAccountNumber || null,
      bankAccountName: data.bankAccountName || null,
      bankSwiftCode: data.bankSwiftCode || null,
      bankIban: data.bankIban || null,
      status: 'active',
      isBlocked: false,
      blockReason: null,
      currentBalance: 0,
      ytdPurchases: 0,
      isTaxExempt: data.isTaxExempt,
      taxExemptNumber: data.taxExemptNumber || null,
      taxCategory: data.taxCategory || null,
      notes: data.notes || null,
      internalNotes: data.internalNotes || null,
      tags: data.tags,
      createdBy: user.id,
      updatedBy: user.id,
    });

    logger.info('Vendor created', {
      vendorId: vendor.id,
      vendorNumber: vendor.vendorNumber,
      vendorName: vendor.vendorName,
      userId: user.id,
    });

    return NextResponse.json(
      {
        success: true,
        vendor,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error creating vendor', { error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// Helper function to generate vendor number
async function generateVendorNumber(companyId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `VEN-${year}-`;

  // Get the last vendor number for this year
  const lastVendor = await Vendor.findOne({
    where: {
      companyId,
      vendorNumber: {
        [Op.like]: `${prefix}%`,
      },
    },
    order: [['createdAt', 'DESC']],
  });

  let nextNumber = 1;
  if (lastVendor) {
    const lastNumberStr = lastVendor.vendorNumber.replace(prefix, '');
    const lastNumber = parseInt(lastNumberStr, 10);
    nextNumber = lastNumber + 1;
  }

  // Pad with zeros to 5 digits
  const paddedNumber = nextNumber.toString().padStart(5, '0');
  return `${prefix}${paddedNumber}`;
}
