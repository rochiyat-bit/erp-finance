import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ChartOfAccount } from '@/lib/db/models';
import { createAccountSchema, listAccountsQuerySchema } from '@/lib/validators/gl';
import { createValidationError, formatErrorResponse, createPermissionError } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';
import { Op } from 'sequelize';

// GET /api/gl/chart-of-accounts - List accounts
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    // Check permission
    if (!hasPermission(user, 'gl.coa.view')) {
      throw createPermissionError('Insufficient permissions to view chart of accounts');
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const query = listAccountsQuerySchema.parse({
      includeInactive: searchParams.get('includeInactive'),
      accountType: searchParams.get('accountType'),
      parentAccountId: searchParams.get('parentAccountId'),
      search: searchParams.get('search'),
      hierarchical: searchParams.get('hierarchical'),
    });

    // Build where clause
    const where: any = {
      companyId: user.companyId,
    };

    if (!query.includeInactive) {
      where.isActive = true;
    }

    if (query.accountType) {
      where.accountType = query.accountType;
    }

    if (query.parentAccountId) {
      where.parentAccountId = query.parentAccountId;
    }

    if (query.search) {
      where[Op.or] = [
        { code: { [Op.iLike]: `%${query.search}%` } },
        { name: { [Op.iLike]: `%${query.search}%` } },
      ];
    }

    // Fetch accounts
    const accounts = await ChartOfAccount.findAll({
      where,
      order: [
        ['code', 'ASC'],
        ['sortOrder', 'ASC'],
      ],
    });

    // If hierarchical is requested, build tree structure
    let result: any = accounts;
    if (query.hierarchical) {
      result = buildAccountHierarchy(accounts);
    }

    return NextResponse.json({
      success: true,
      accounts: result,
    });
  } catch (error) {
    logger.error('Error listing chart of accounts', { error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// POST /api/gl/chart-of-accounts - Create new account
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    // Check permission
    if (!hasPermission(user, 'gl.coa.create')) {
      throw createPermissionError('Insufficient permissions to create accounts');
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = createAccountSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      throw createValidationError(firstError.message, firstError.path.join('.'));
    }

    const data = validation.data;

    // Check if code already exists
    const existingAccount = await ChartOfAccount.findOne({
      where: {
        companyId: user.companyId,
        code: data.code,
      },
    });

    if (existingAccount) {
      throw createValidationError('Account code already exists', 'code');
    }

    // Validate parent account if provided
    if (data.parentAccountId) {
      const parentAccount = await ChartOfAccount.findByPk(data.parentAccountId);
      if (!parentAccount) {
        throw createValidationError('Parent account not found', 'parentAccountId');
      }
      if (!parentAccount.isHeader) {
        throw createValidationError('Parent account must be a header account', 'parentAccountId');
      }
    }

    // Calculate level
    const level = data.parentAccountId ? 2 : 1; // Simplified level calculation

    // Create account
    const account = await ChartOfAccount.create({
      companyId: user.companyId,
      code: data.code,
      name: data.name,
      description: data.description,
      accountType: data.accountType,
      accountSubType: data.accountSubType,
      category: data.category,
      normalBalance: data.normalBalance,
      parentAccountId: data.parentAccountId,
      level,
      sortOrder: 0,
      currencyCode: data.currencyCode,
      allowMultiCurrency: data.allowMultiCurrency || false,
      allowManualEntry: data.allowManualEntry !== undefined ? data.allowManualEntry : true,
      isHeader: data.isHeader || false,
      isControlAccount: false,
      isSystemAccount: false,
      isActive: true,
      requiresCostCenter: false,
      requiresProject: false,
      currentBalance: 0,
      openingBalance: data.openingBalance || 0,
      openingBalanceDate: data.openingBalance ? new Date() : undefined,
      createdBy: user.id,
      updatedBy: user.id,
    });

    logger.info('Chart of account created', {
      accountId: account.id,
      code: account.code,
      userId: user.id,
    });

    return NextResponse.json(
      {
        success: true,
        account,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error creating chart of account', { error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// Helper function to build account hierarchy
function buildAccountHierarchy(accounts: ChartOfAccount[]): any[] {
  const accountMap = new Map();
  const roots: any[] = [];

  // Create map of all accounts
  accounts.forEach((account: any) => {
    accountMap.set(account.id, { ...account.toJSON(), children: [] });
  });

  // Build hierarchy
  accounts.forEach((account: any) => {
    const node = accountMap.get(account.id);
    if (account.parentAccountId) {
      const parent = accountMap.get(account.parentAccountId);
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
}
