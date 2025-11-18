import { FixedAsset, AssetDepreciation, FiscalPeriod } from '../db/models';
import sequelize from '../db/sequelize';
import { Transaction } from 'sequelize';

// Helper function to calculate months between two dates
function calculateMonthsBetween(startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const years = end.getFullYear() - start.getFullYear();
  const months = end.getMonth() - start.getMonth();

  return years * 12 + months;
}

// Straight Line Depreciation
export function calculateStraightLineDepreciation(
  cost: number,
  salvageValue: number,
  usefulLifeMonths: number
): number {
  const depreciableAmount = cost - salvageValue;
  const monthlyDepreciation = depreciableAmount / usefulLifeMonths;
  return Math.round(monthlyDepreciation * 100) / 100;
}

// Declining Balance Depreciation (e.g., Double Declining Balance)
export function calculateDecliningBalanceDepreciation(
  cost: number,
  accumulatedDepreciation: number,
  salvageValue: number,
  usefulLifeMonths: number,
  depreciationRate: number = 200 // 200% for double declining
): number {
  const bookValue = cost - accumulatedDepreciation;

  // Don't depreciate below salvage value
  if (bookValue <= salvageValue) {
    return 0;
  }

  // Calculate declining rate
  const straightLineRate = 100 / usefulLifeMonths;
  const decliningRate = (straightLineRate * depreciationRate) / 100;

  // Monthly depreciation
  const monthlyDepreciation = bookValue * (decliningRate / 12);

  // Ensure we don't go below salvage value
  const maxDepreciation = bookValue - salvageValue;
  return Math.round(Math.min(monthlyDepreciation, maxDepreciation) * 100) / 100;
}

// Sum of Years Digits Depreciation
export function calculateSumOfYearsDepreciation(
  cost: number,
  salvageValue: number,
  usefulLifeMonths: number,
  periodsElapsed: number
): number {
  const depreciableAmount = cost - salvageValue;
  const years = Math.ceil(usefulLifeMonths / 12);
  const sumOfYears = (years * (years + 1)) / 2;

  // Determine which year we're in
  const currentYear = Math.floor(periodsElapsed / 12) + 1;

  if (currentYear > years) {
    return 0; // Fully depreciated
  }

  const remainingYears = years - currentYear + 1;

  // Calculate depreciation for this year
  const yearlyDepreciation = (remainingYears / sumOfYears) * depreciableAmount;
  const monthlyDepreciation = yearlyDepreciation / 12;

  return Math.round(monthlyDepreciation * 100) / 100;
}

// Units of Production Depreciation
export function calculateUnitsOfProductionDepreciation(
  cost: number,
  salvageValue: number,
  totalExpectedUnits: number,
  unitsProducedThisPeriod: number
): number {
  const depreciableAmount = cost - salvageValue;
  const perUnitDepreciation = depreciableAmount / totalExpectedUnits;
  const depreciation = perUnitDepreciation * unitsProducedThisPeriod;

  return Math.round(depreciation * 100) / 100;
}

// Main asset depreciation calculation function
export async function calculateAssetDepreciation(
  assetId: string,
  fiscalPeriodId: string,
  depreciationDate: Date,
  unitsProduced: number = 0,
  userId: string,
  transaction?: Transaction
): Promise<AssetDepreciation> {
  const t = transaction || await sequelize.transaction();

  try {
    // Fetch asset with category
    const asset = await FixedAsset.findByPk(assetId, {
      transaction: t,
    });

    if (!asset) {
      throw new Error('Asset not found');
    }

    // Check if asset is active
    if (asset.status !== 'active') {
      throw new Error('Can only calculate depreciation for active assets');
    }

    // Get fiscal period
    const period = await FiscalPeriod.findByPk(fiscalPeriodId, {
      transaction: t,
    });

    if (!period) {
      throw new Error('Fiscal period not found');
    }

    // Check if already calculated for this period
    const existing = await AssetDepreciation.findOne({
      where: {
        assetId,
        fiscalPeriodId,
      },
      transaction: t,
    });

    if (existing) {
      throw new Error('Depreciation already calculated for this period');
    }

    // Get accumulated depreciation and book value
    const accumulatedDep = Number(asset.accumulatedDepreciation);
    const openingBookValue = Number(asset.bookValue);

    // Check if asset is fully depreciated
    if (openingBookValue <= Number(asset.salvageValue)) {
      // Asset is fully depreciated, create zero depreciation record
      const depreciation = await AssetDepreciation.create({
        companyId: asset.companyId,
        assetId: asset.id,
        fiscalYearId: period.fiscalYearId,
        fiscalPeriodId: period.id,
        depreciationDate,
        openingBookValue,
        depreciationAmount: 0,
        accumulatedDepreciation: accumulatedDep,
        closingBookValue: openingBookValue,
        depreciationMethod: asset.depreciationMethod,
        calculationBasis: 'Fully depreciated',
        unitsProduced,
        status: 'calculated',
        createdBy: userId,
      }, { transaction: t });

      if (!transaction) await t.commit();
      return depreciation;
    }

    // Calculate periods elapsed since depreciation start
    const startDate = asset.depreciationStartDate || asset.acquisitionDate;
    const periodsElapsed = calculateMonthsBetween(startDate, depreciationDate);

    let depreciationAmount = 0;
    let calculationBasis = '';

    // Calculate based on method
    switch (asset.depreciationMethod) {
      case 'straight_line':
        depreciationAmount = calculateStraightLineDepreciation(
          Number(asset.totalCost),
          Number(asset.salvageValue),
          asset.usefulLifeMonths!
        );
        calculationBasis = `Straight-line: (${asset.totalCost} - ${asset.salvageValue}) / ${asset.usefulLifeMonths} months`;
        break;

      case 'declining_balance':
        depreciationAmount = calculateDecliningBalanceDepreciation(
          Number(asset.totalCost),
          accumulatedDep,
          Number(asset.salvageValue),
          asset.usefulLifeMonths!,
          Number(asset.depreciationRate) || 200
        );
        calculationBasis = `Declining balance (${asset.depreciationRate}%): ${openingBookValue} × ${asset.depreciationRate}% / 12`;
        break;

      case 'sum_of_years':
        depreciationAmount = calculateSumOfYearsDepreciation(
          Number(asset.totalCost),
          Number(asset.salvageValue),
          asset.usefulLifeMonths!,
          periodsElapsed
        );
        const years = Math.ceil(asset.usefulLifeMonths! / 12);
        const currentYear = Math.floor(periodsElapsed / 12) + 1;
        const remainingYears = years - currentYear + 1;
        calculationBasis = `Sum of years: ${remainingYears}/${(years * (years + 1)) / 2} × ${asset.totalCost - asset.salvageValue}`;
        break;

      case 'units_of_production':
        if (!asset.unitsOfProductionTotal) {
          throw new Error('Total units required for units of production method');
        }
        depreciationAmount = calculateUnitsOfProductionDepreciation(
          Number(asset.totalCost),
          Number(asset.salvageValue),
          asset.unitsOfProductionTotal,
          unitsProduced
        );
        calculationBasis = `Units of production: ${unitsProduced} units / ${asset.unitsOfProductionTotal} total units`;
        break;

      case 'manual':
        // Manual entry, no calculation
        depreciationAmount = 0;
        calculationBasis = 'Manual entry required';
        break;

      default:
        throw new Error(`Unknown depreciation method: ${asset.depreciationMethod}`);
    }

    // Ensure we don't depreciate below salvage value
    const maxDepreciation = openingBookValue - Number(asset.salvageValue);
    if (depreciationAmount > maxDepreciation) {
      depreciationAmount = maxDepreciation;
      calculationBasis += ' (limited to salvage value)';
    }

    // Round to 2 decimals
    depreciationAmount = Math.round(depreciationAmount * 100) / 100;

    // Create depreciation record
    const depreciation = await AssetDepreciation.create({
      companyId: asset.companyId,
      assetId: asset.id,
      fiscalYearId: period.fiscalYearId,
      fiscalPeriodId: period.id,
      depreciationDate,
      openingBookValue,
      depreciationAmount,
      accumulatedDepreciation: accumulatedDep + depreciationAmount,
      closingBookValue: openingBookValue - depreciationAmount,
      depreciationMethod: asset.depreciationMethod,
      calculationBasis,
      unitsProduced: asset.depreciationMethod === 'units_of_production' ? unitsProduced : null,
      status: 'calculated',
      createdBy: userId,
    }, { transaction: t });

    // Update asset
    await asset.update({
      accumulatedDepreciation: accumulatedDep + depreciationAmount,
      bookValue: openingBookValue - depreciationAmount,
      remainingValue: (openingBookValue - depreciationAmount) - Number(asset.salvageValue),
    }, { transaction: t });

    if (!transaction) await t.commit();

    return depreciation;

  } catch (error) {
    if (!transaction) await t.rollback();
    throw error;
  }
}

// Batch calculate depreciation for multiple assets
export async function batchCalculateDepreciation(
  fiscalPeriodId: string,
  assetIds: string[] | null, // null = all active assets
  depreciationDate: Date,
  userId: string,
  companyId: string
): Promise<{
  depreciationsCalculated: number;
  totalDepreciationAmount: number;
  depreciations: AssetDepreciation[];
  errors: Array<{ assetId: string; error: string }>;
}> {
  // Get assets to depreciate
  const where: any = {
    companyId,
    status: 'active',
  };

  if (assetIds && assetIds.length > 0) {
    where.id = assetIds;
  }

  const assets = await FixedAsset.findAll({ where });

  const depreciations: AssetDepreciation[] = [];
  const errors: Array<{ assetId: string; error: string }> = [];
  let totalAmount = 0;

  // Calculate for each asset
  for (const asset of assets) {
    try {
      const depreciation = await calculateAssetDepreciation(
        asset.id,
        fiscalPeriodId,
        depreciationDate,
        0, // units produced - would need to be provided per asset
        userId
      );

      depreciations.push(depreciation);
      totalAmount += Number(depreciation.depreciationAmount);

    } catch (error: any) {
      errors.push({
        assetId: asset.id,
        error: error.message,
      });
    }
  }

  return {
    depreciationsCalculated: depreciations.length,
    totalDepreciationAmount: Math.round(totalAmount * 100) / 100,
    depreciations,
    errors,
  };
}

// Generate depreciation schedule for an asset
export async function generateDepreciationSchedule(
  assetId: string
): Promise<Array<{
  periodNumber: number;
  periodDate: Date;
  openingBookValue: number;
  depreciationAmount: number;
  accumulatedDepreciation: number;
  closingBookValue: number;
}>> {
  const asset = await FixedAsset.findByPk(assetId);

  if (!asset) {
    throw new Error('Asset not found');
  }

  const startDate = asset.depreciationStartDate || asset.acquisitionDate;
  const usefulLifeMonths = asset.usefulLifeMonths!;

  const schedule = [];

  let bookValue = Number(asset.totalCost);
  let accumulatedDep = 0;

  for (let month = 1; month <= usefulLifeMonths; month++) {
    const periodDate = new Date(startDate);
    periodDate.setMonth(periodDate.getMonth() + month);

    // Calculate depreciation for this period
    let depAmount = 0;

    switch (asset.depreciationMethod) {
      case 'straight_line':
        depAmount = calculateStraightLineDepreciation(
          Number(asset.totalCost),
          Number(asset.salvageValue),
          usefulLifeMonths
        );
        break;

      case 'declining_balance':
        depAmount = calculateDecliningBalanceDepreciation(
          Number(asset.totalCost),
          accumulatedDep,
          Number(asset.salvageValue),
          usefulLifeMonths,
          Number(asset.depreciationRate) || 200
        );
        break;

      case 'sum_of_years':
        depAmount = calculateSumOfYearsDepreciation(
          Number(asset.totalCost),
          Number(asset.salvageValue),
          usefulLifeMonths,
          month - 1
        );
        break;

      default:
        // For other methods, use straight line as default
        depAmount = calculateStraightLineDepreciation(
          Number(asset.totalCost),
          Number(asset.salvageValue),
          usefulLifeMonths
        );
    }

    // Ensure we don't depreciate below salvage value
    if (bookValue - depAmount < Number(asset.salvageValue)) {
      depAmount = bookValue - Number(asset.salvageValue);
    }

    if (depAmount < 0) depAmount = 0;

    accumulatedDep += depAmount;
    bookValue -= depAmount;

    schedule.push({
      periodNumber: month,
      periodDate,
      openingBookValue: bookValue + depAmount,
      depreciationAmount: Math.round(depAmount * 100) / 100,
      accumulatedDepreciation: Math.round(accumulatedDep * 100) / 100,
      closingBookValue: Math.round(bookValue * 100) / 100,
    });

    // Stop if we've reached salvage value
    if (bookValue <= Number(asset.salvageValue)) {
      break;
    }
  }

  return schedule;
}
