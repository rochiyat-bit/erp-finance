import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AssetCategory, FixedAsset } from '@/lib/db/models';
import { updateAssetCategorySchema } from '@/lib/validators/fa';
import { createPermissionError, createValidationError, formatErrorResponse } from '@/lib/error-handler';
import { hasPermission } from '@/lib/permissions';
import logger from '@/lib/logger';

// GET /api/fa/asset-categories/:id
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

    if (!hasPermission(user, 'fa.categories.view')) {
      throw createPermissionError('Insufficient permissions to view asset categories');
    }

    const category = await AssetCategory.findOne({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!category) {
      throw createValidationError('Asset category not found', 'categoryId');
    }

    // Get asset count
    const assetCount = await FixedAsset.count({
      where: {
        assetCategoryId: category.id,
        companyId: user.companyId,
      },
    });

    return NextResponse.json({
      success: true,
      category,
      assetCount,
    });
  } catch (error) {
    logger.error('Error fetching asset category', { categoryId: params.id, error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// PATCH /api/fa/asset-categories/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    if (!hasPermission(user, 'fa.categories.manage')) {
      throw createPermissionError('Insufficient permissions to edit asset categories');
    }

    const category = await AssetCategory.findOne({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!category) {
      throw createValidationError('Asset category not found', 'categoryId');
    }

    const body = await req.json();
    const validation = updateAssetCategorySchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      throw createValidationError(firstError.message, firstError.path.join('.'));
    }

    const data = validation.data;

    // Check for duplicate category code if changing
    if (data.categoryCode && data.categoryCode !== category.categoryCode) {
      const existing = await AssetCategory.findOne({
        where: {
          companyId: user.companyId,
          categoryCode: data.categoryCode,
        },
      });

      if (existing) {
        throw createValidationError('Category code already exists', 'categoryCode');
      }
    }

    // Update level if parent changed
    if (data.parentCategoryId !== undefined) {
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

        // Check for circular reference
        if (parent.id === category.id) {
          throw createValidationError('Category cannot be its own parent', 'parentCategoryId');
        }

        level = parent.level + 1;
      }

      await category.update({
        ...data,
        level,
        updatedBy: user.id,
      });
    } else {
      await category.update({
        ...data,
        updatedBy: user.id,
      });
    }

    logger.info('Asset category updated', {
      categoryId: category.id,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      category,
    });
  } catch (error) {
    logger.error('Error updating asset category', { categoryId: params.id, error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// DELETE /api/fa/asset-categories/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createPermissionError('Authentication required');
    }

    const user = session.user as any;

    if (!hasPermission(user, 'fa.categories.manage')) {
      throw createPermissionError('Insufficient permissions to delete asset categories');
    }

    const category = await AssetCategory.findOne({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!category) {
      throw createValidationError('Asset category not found', 'categoryId');
    }

    // Check if category has assets
    const assetCount = await FixedAsset.count({
      where: {
        assetCategoryId: category.id,
      },
    });

    if (assetCount > 0) {
      throw createValidationError(
        `Cannot delete category with ${assetCount} asset(s). Please reassign or delete assets first.`,
        'categoryId'
      );
    }

    // Check if category has subcategories
    const subcategoryCount = await AssetCategory.count({
      where: {
        parentCategoryId: category.id,
      },
    });

    if (subcategoryCount > 0) {
      throw createValidationError(
        `Cannot delete category with ${subcategoryCount} subcategory(ies). Please delete subcategories first.`,
        'categoryId'
      );
    }

    await category.destroy();

    logger.info('Asset category deleted', {
      categoryId: params.id,
      categoryCode: category.categoryCode,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: `Asset category ${category.categoryCode} deleted successfully`,
    });
  } catch (error) {
    logger.error('Error deleting asset category', { categoryId: params.id, error });
    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
