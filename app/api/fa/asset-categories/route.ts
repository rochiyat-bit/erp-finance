import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AssetCategory, FixedAsset } from '@/lib/db/models';
import { createAssetCategorySchema } from '@/lib/validators/fa';
import { createPermissionError, createValidationError, formatErrorResponse } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';
import { Op } from 'sequelize';

// GET /api/fa/asset-categories - List categories
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    if (!hasPermission(user, 'fa.categories.view')) {
      throw createPermissionError('Insufficient permissions to view asset categories');
    }

    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const hierarchical = searchParams.get('hierarchical') === 'true';

    const where: any = {
      companyId: user.companyId,
    };

    if (!includeInactive) {
      where.isActive = true;
    }

    const categories = await AssetCategory.findAll({
      where,
      order: [['categoryCode', 'ASC']],
    });

    let response: any = {
      success: true,
      categories,
    };

    // Build hierarchy if requested
    if (hierarchical) {
      const categoryMap = new Map();
      categories.forEach(cat => categoryMap.set(cat.id, { ...cat.toJSON(), children: [] }));

      const hierarchy: any[] = [];
      categoryMap.forEach(cat => {
        if (cat.parentCategoryId) {
          const parent = categoryMap.get(cat.parentCategoryId);
          if (parent) {
            parent.children.push(cat);
          }
        } else {
          hierarchy.push(cat);
        }
      });

      response.hierarchy = hierarchy;
    }

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error listing asset categories', { error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// POST /api/fa/asset-categories - Create category
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    if (!hasPermission(user, 'fa.categories.manage')) {
      throw createPermissionError('Insufficient permissions to create asset categories');
    }

    const body = await req.json();
    const validation = createAssetCategorySchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      throw createValidationError(firstError.message, firstError.path.join('.'));
    }

    const data = validation.data;

    // Check for duplicate category code
    const existing = await AssetCategory.findOne({
      where: {
        companyId: user.companyId,
        categoryCode: data.categoryCode,
      },
    });

    if (existing) {
      throw createValidationError('Category code already exists', 'categoryCode');
    }

    // Determine level based on parent
    let level = 1;
    if (data.parentCategoryId) {
      const parent = await AssetCategory.findOne({
        where: {
          id: data.parentCategoryId,
          companyId: user.companyId,
        },
      });

      if (!parent) {
        throw createValidationError('Parent category not found', 'parentCategoryId');
      }

      level = parent.level + 1;
    }

    const category = await AssetCategory.create({
      ...data,
      companyId: user.companyId,
      level,
      createdBy: user.id,
      updatedBy: user.id,
    });

    logger.info('Asset category created', {
      categoryId: category.id,
      categoryCode: category.categoryCode,
      userId: user.id,
    });

    return NextResponse.json(
      {
        success: true,
        category,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error creating asset category', { error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
