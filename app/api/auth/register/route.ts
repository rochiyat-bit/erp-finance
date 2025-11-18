import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Company, User } from '@/lib/db/models';
import { registerSchema } from '@/lib/validators/auth';
import { createValidationError, formatErrorResponse } from '@/lib/error-handler';
import logger from '@/lib/logger';
import { checkRegistrationRateLimit, getClientIdentifier } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(req);
    await checkRegistrationRateLimit(identifier);

    // Parse and validate request body
    const body = await req.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      throw createValidationError(firstError.message, firstError.path.join('.'));
    }

    const { company: companyData, user: userData } = validation.data;

    // Check if company email already exists
    const existingCompany = await Company.findOne({
      where: { email: companyData.email },
    });

    if (existingCompany) {
      throw createValidationError('Company email already exists', 'company.email');
    }

    // Check if user email already exists (across all companies)
    const existingUser = await User.findOne({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw createValidationError('Email already exists', 'user.email');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      userData.password,
      parseInt(process.env.BCRYPT_ROUNDS || '12')
    );

    // Create company
    const company = await Company.create({
      name: companyData.name,
      displayName: companyData.name,
      taxId: companyData.taxId,
      registrationNumber: companyData.taxId, // Using taxId as default
      email: companyData.email,
      phone: companyData.phone,
      address: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      baseCurrency: companyData.baseCurrency,
      fiscalYearStart: 1,
      fiscalYearEnd: 12,
      dateFormat: 'DD/MM/YYYY',
      numberFormat: '1,000.00',
      timeZone: 'UTC',
      subscriptionPlan: 'trial',
      subscriptionStatus: 'active',
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
      maxUsers: 5,
      maxTransactionsPerMonth: 1000,
      isActive: true,
      createdBy: 'system',
      updatedBy: 'system',
    });

    // Create admin user
    const user = await User.create({
      companyId: company.id,
      email: userData.email,
      password: hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      displayName: `${userData.firstName} ${userData.lastName}`,
      role: 'admin',
      permissions: ['*'], // Admin has all permissions
      status: 'active',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      twoFactorEnabled: false,
      failedLoginAttempts: 0,
      language: 'en',
      theme: 'system',
      notificationPreferences: {},
    });

    // Update company createdBy with actual user ID
    await company.update({
      createdBy: user.id,
      updatedBy: user.id,
    });

    logger.info('New company registered', {
      companyId: company.id,
      userId: user.id,
      email: user.email,
    });

    // Return success response (without password)
    const userResponse = {
      id: user.id,
      companyId: user.companyId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      role: user.role,
      permissions: user.permissions,
      status: user.status,
      createdAt: user.createdAt,
    };

    return NextResponse.json(
      {
        success: true,
        company,
        user: userResponse,
        message: 'Registration successful',
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Registration error:', error);
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
