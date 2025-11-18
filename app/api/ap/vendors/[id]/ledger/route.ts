import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Vendor, Bill, BillPayment, PaymentAllocation } from '@/lib/db/models';
import { vendorLedgerQuerySchema } from '@/lib/validators/ap';
import { createValidationError, formatErrorResponse, createPermissionError } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';
import { Op } from 'sequelize';

// GET /api/ap/vendors/[id]/ledger - Get vendor ledger
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    // Check permission
    if (!hasPermission(user, 'ap.vendors.view')) {
      throw createPermissionError('Insufficient permissions to view vendor ledger');
    }

    // Validate vendor exists and belongs to company
    const vendor = await Vendor.findOne({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!vendor) {
      throw createValidationError('Vendor not found', 'vendorId');
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const query = vendorLedgerQuerySchema.parse({
      vendorId: params.id,
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      includeDetails: searchParams.get('includeDetails'),
    });

    // Build where clause for date range
    const dateWhere: any = {};
    if (query.startDate && query.endDate) {
      dateWhere.createdAt = {
        [Op.between]: [new Date(query.startDate), new Date(query.endDate)],
      };
    }

    // Fetch bills
    const bills = await Bill.findAll({
      where: {
        companyId: user.companyId,
        vendorId: params.id,
        isPosted: true,
        ...dateWhere,
      },
      order: [['billDate', 'ASC']],
    });

    // Fetch payments with allocations
    const payments = await BillPayment.findAll({
      where: {
        companyId: user.companyId,
        vendorId: params.id,
        isPosted: true,
        ...dateWhere,
      },
      include: query.includeDetails ? [
        {
          model: PaymentAllocation,
          as: 'allocations',
          include: [
            {
              model: Bill,
              as: 'bill',
              attributes: ['id', 'billNumber', 'billDate'],
            },
          ],
        },
      ] : [],
      order: [['paymentDate', 'ASC']],
    });

    // Combine and sort transactions
    const transactions: any[] = [];

    bills.forEach(bill => {
      transactions.push({
        type: 'bill',
        date: bill.billDate,
        documentNumber: bill.billNumber,
        referenceNumber: bill.vendorInvoiceNumber,
        description: bill.description,
        debit: bill.totalAmount,
        credit: 0,
        balance: 0, // Will be calculated below
        status: bill.status,
        details: query.includeDetails ? bill : undefined,
      });
    });

    payments.forEach(payment => {
      transactions.push({
        type: 'payment',
        date: payment.paymentDate,
        documentNumber: payment.paymentNumber,
        referenceNumber: payment.referenceNumber,
        description: payment.description,
        debit: 0,
        credit: payment.paymentAmount,
        balance: 0, // Will be calculated below
        status: payment.status,
        details: query.includeDetails ? payment : undefined,
      });
    });

    // Sort by date
    transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running balance
    let runningBalance = 0;
    transactions.forEach(txn => {
      runningBalance += Number(txn.debit) - Number(txn.credit);
      txn.balance = runningBalance;
    });

    // Calculate summary
    const totalBills = bills.reduce((sum, bill) => sum + Number(bill.totalAmount), 0);
    const totalPayments = payments.reduce((sum, payment) => sum + Number(payment.paymentAmount), 0);
    const currentBalance = totalBills - totalPayments;

    return NextResponse.json({
      success: true,
      vendor: {
        id: vendor.id,
        vendorNumber: vendor.vendorNumber,
        vendorName: vendor.vendorName,
        currentBalance: vendor.currentBalance,
      },
      summary: {
        totalBills,
        totalPayments,
        currentBalance,
        billCount: bills.length,
        paymentCount: payments.length,
      },
      transactions,
    });
  } catch (error) {
    logger.error('Error fetching vendor ledger', { vendorId: params.id, error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
