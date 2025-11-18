import { z } from 'zod';

// Asset Category Validators
export const createAssetCategorySchema = z.object({
  categoryCode: z.string().min(1, 'Category code is required').max(50),
  categoryName: z.string().min(1, 'Category name is required').max(200),
  description: z.string().optional(),
  parentCategoryId: z.string().uuid('Invalid parent category ID').optional(),

  // GL Accounts
  assetAccountId: z.string().uuid('Invalid asset account ID'),
  accumulatedDepreciationAccountId: z.string().uuid('Invalid accumulated depreciation account ID'),
  depreciationExpenseAccountId: z.string().uuid('Invalid depreciation expense account ID'),
  disposalGainAccountId: z.string().uuid('Invalid disposal gain account ID').optional(),
  disposalLossAccountId: z.string().uuid('Invalid disposal loss account ID').optional(),

  // Default Depreciation Settings
  defaultDepreciationMethod: z.enum(['straight_line', 'declining_balance', 'sum_of_years', 'units_of_production', 'manual']),
  defaultUsefulLifeYears: z.number().int().positive('Useful life years must be positive').optional(),
  defaultUsefulLifeMonths: z.number().int().positive('Useful life months must be positive').optional(),
  defaultSalvageValuePercent: z.number().min(0).max(100, 'Salvage value percent must be between 0 and 100').optional(),
  defaultDepreciationRate: z.number().positive('Depreciation rate must be positive').optional(),

  // Settings
  requiresInsurance: z.boolean().default(false),
  requiresMaintenance: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const updateAssetCategorySchema = createAssetCategorySchema.partial();

// Asset Location Validators
export const createAssetLocationSchema = z.object({
  locationCode: z.string().min(1, 'Location code is required').max(50),
  locationName: z.string().min(1, 'Location name is required').max(200),
  description: z.string().optional(),

  // Address
  addressLine1: z.string().max(255).optional(),
  addressLine2: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),

  // Contact
  contactPerson: z.string().max(200).optional(),
  contactPhone: z.string().max(50).optional(),

  parentLocationId: z.string().uuid('Invalid parent location ID').optional(),
  isActive: z.boolean().default(true),
});

export const updateAssetLocationSchema = createAssetLocationSchema.partial();

// Fixed Asset Validators
export const createFixedAssetSchema = z.object({
  assetName: z.string().min(1, 'Asset name is required').max(200),
  description: z.string().optional(),
  barcode: z.string().max(100).optional(),
  serialNumber: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  manufacturer: z.string().max(200).optional(),

  // Classification
  assetCategoryId: z.string().uuid('Invalid asset category ID'),
  assetType: z.enum(['tangible', 'intangible']),
  assetClass: z.enum(['property', 'building', 'machinery', 'vehicle', 'furniture', 'equipment', 'software', 'other']),

  // Location & Assignment
  locationId: z.string().uuid('Invalid location ID').optional(),
  departmentId: z.string().uuid('Invalid department ID').optional(),
  assignedToUserId: z.string().uuid('Invalid user ID').optional(),

  // Acquisition Details
  acquisitionDate: z.string().or(z.date()),
  purchaseDate: z.string().or(z.date()).optional(),
  vendorId: z.string().uuid('Invalid vendor ID').optional(),
  purchaseOrderId: z.string().uuid('Invalid PO ID').optional(),
  billId: z.string().uuid('Invalid bill ID').optional(),

  // Financial - Cost
  acquisitionCost: z.number().positive('Acquisition cost must be positive'),
  additionalCosts: z.number().min(0, 'Additional costs cannot be negative').default(0),
  currencyCode: z.string().length(3, 'Currency code must be 3 characters').default('USD'),
  exchangeRate: z.number().positive('Exchange rate must be positive').default(1),

  // Financial - Salvage Value
  salvageValue: z.number().min(0, 'Salvage value cannot be negative'),
  salvageValuePercent: z.number().min(0).max(100).optional(),

  // Depreciation Settings
  depreciationMethod: z.enum(['straight_line', 'declining_balance', 'sum_of_years', 'units_of_production', 'manual']),
  usefulLifeYears: z.number().int().positive('Useful life years must be positive').optional(),
  usefulLifeMonths: z.number().int().positive('Useful life months must be positive').optional(),
  depreciationRate: z.number().positive('Depreciation rate must be positive').optional(),
  unitsOfProductionTotal: z.number().int().positive('Total units must be positive').optional(),

  depreciationStartDate: z.string().or(z.date()).optional(),
  firstDepreciationAmount: z.number().positive().optional(),

  // GL Accounts
  assetAccountId: z.string().uuid('Invalid asset account ID'),
  accumulatedDepreciationAccountId: z.string().uuid('Invalid accumulated depreciation account ID'),
  depreciationExpenseAccountId: z.string().uuid('Invalid depreciation expense account ID'),

  // Warranty & Insurance
  warrantyStartDate: z.string().or(z.date()).optional(),
  warrantyEndDate: z.string().or(z.date()).optional(),
  warrantyProvider: z.string().max(200).optional(),
  insurancePolicyNumber: z.string().max(100).optional(),
  insuranceProvider: z.string().max(200).optional(),
  insuranceStartDate: z.string().or(z.date()).optional(),
  insuranceEndDate: z.string().or(z.date()).optional(),
  insuranceCoverageAmount: z.number().positive().optional(),

  // Maintenance
  maintenanceFrequencyDays: z.number().int().positive().optional(),

  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  photo: z.string().max(500).optional(),
}).refine((data) => {
  // Ensure salvage value is less than total cost
  const totalCost = data.acquisitionCost + data.additionalCosts;
  return data.salvageValue < totalCost;
}, {
  message: 'Salvage value must be less than total cost',
  path: ['salvageValue'],
}).refine((data) => {
  // Ensure at least one useful life is provided
  return data.usefulLifeYears || data.usefulLifeMonths;
}, {
  message: 'Either useful life years or months must be provided',
  path: ['usefulLifeYears'],
}).refine((data) => {
  // For units of production, require total units
  if (data.depreciationMethod === 'units_of_production') {
    return !!data.unitsOfProductionTotal;
  }
  return true;
}, {
  message: 'Total units required for units of production method',
  path: ['unitsOfProductionTotal'],
});

export const updateFixedAssetSchema = createFixedAssetSchema.partial();

// Depreciation Validators
export const calculateDepreciationSchema = z.object({
  fiscalPeriodId: z.string().uuid('Invalid fiscal period ID'),
  assetIds: z.array(z.string().uuid()).optional(), // If not provided, calculate for all active assets
  depreciationDate: z.string().or(z.date()),
});

export const postDepreciationSchema = z.object({
  depreciationIds: z.array(z.string().uuid('Invalid depreciation ID')).min(1, 'At least one depreciation ID required'),
  postingDate: z.string().or(z.date()),
});

export const reverseDepreciationSchema = z.object({
  reason: z.string().min(1, 'Reason is required'),
});

// Asset Movement Validators
export const createAssetMovementSchema = z.object({
  assetId: z.string().uuid('Invalid asset ID'),
  movementDate: z.string().or(z.date()),
  movementType: z.enum(['transfer', 'assignment', 'return', 'relocation']),

  // From
  fromLocationId: z.string().uuid('Invalid from location ID').optional(),
  fromDepartmentId: z.string().uuid('Invalid from department ID').optional(),
  fromUserId: z.string().uuid('Invalid from user ID').optional(),

  // To
  toLocationId: z.string().uuid('Invalid to location ID').optional(),
  toDepartmentId: z.string().uuid('Invalid to department ID').optional(),
  toUserId: z.string().uuid('Invalid to user ID').optional(),

  reason: z.string().optional(),
  notes: z.string().optional(),
  requiresApproval: z.boolean().default(false),
}).refine((data) => {
  // Ensure at least one "from" is provided
  return data.fromLocationId || data.fromDepartmentId || data.fromUserId;
}, {
  message: 'At least one "from" field must be provided',
  path: ['fromLocationId'],
}).refine((data) => {
  // Ensure at least one "to" is provided
  return data.toLocationId || data.toDepartmentId || data.toUserId;
}, {
  message: 'At least one "to" field must be provided',
  path: ['toLocationId'],
});

// Asset Maintenance Validators
export const createAssetMaintenanceSchema = z.object({
  assetId: z.string().uuid('Invalid asset ID'),
  maintenanceDate: z.string().or(z.date()),
  maintenanceType: z.enum(['preventive', 'corrective', 'breakdown', 'inspection', 'calibration']),

  serviceProvider: z.string().max(200).optional(),
  vendorId: z.string().uuid('Invalid vendor ID').optional(),
  technicianName: z.string().max(200).optional(),

  description: z.string().min(1, 'Description is required'),
  workPerformed: z.string().optional(),
  partsReplaced: z.string().optional(),

  laborCost: z.number().min(0, 'Labor cost cannot be negative').default(0),
  partsCost: z.number().min(0, 'Parts cost cannot be negative').default(0),
  otherCosts: z.number().min(0, 'Other costs cannot be negative').default(0),

  downtimeHours: z.number().min(0, 'Downtime cannot be negative').optional(),
  nextMaintenanceDate: z.string().or(z.date()).optional(),

  notes: z.string().optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).default('scheduled'),
});

export const updateAssetMaintenanceSchema = createAssetMaintenanceSchema.partial();

// Asset Revaluation Validators
export const createAssetRevaluationSchema = z.object({
  assetId: z.string().uuid('Invalid asset ID'),
  revaluationDate: z.string().or(z.date()),
  revaluationMethod: z.enum(['market_value', 'replacement_cost', 'professional_appraisal', 'indexed']),

  revaluedAmount: z.number().positive('Revalued amount must be positive'),

  appraiserId: z.string().uuid('Invalid appraiser ID').optional(),
  appraiserName: z.string().max(200).optional(),
  appraisalReport: z.string().max(500).optional(),

  revaluationReserveAccountId: z.string().uuid('Invalid revaluation reserve account ID').optional(),

  reason: z.string().optional(),
  notes: z.string().optional(),
});

// Asset Disposal Validators
export const createAssetDisposalSchema = z.object({
  assetId: z.string().uuid('Invalid asset ID'),
  disposalDate: z.string().or(z.date()),
  disposalMethod: z.enum(['sold', 'scrapped', 'traded', 'donated', 'stolen', 'lost']),

  // Sale Details (required if sold)
  saleAmount: z.number().positive('Sale amount must be positive').optional(),
  buyerId: z.string().uuid('Invalid buyer ID').optional(),

  // Trade-in Details (required if traded)
  tradeInValue: z.number().positive('Trade-in value must be positive').optional(),
  newAssetId: z.string().uuid('Invalid new asset ID').optional(),

  disposalCosts: z.number().min(0, 'Disposal costs cannot be negative').default(0),

  reason: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  // If sold, require sale amount and buyer
  if (data.disposalMethod === 'sold') {
    return data.saleAmount && data.saleAmount > 0 && data.buyerId;
  }
  return true;
}, {
  message: 'Sale amount and buyer required for sold assets',
  path: ['saleAmount'],
}).refine((data) => {
  // If traded, require trade-in value
  if (data.disposalMethod === 'traded') {
    return data.tradeInValue && data.tradeInValue > 0;
  }
  return true;
}, {
  message: 'Trade-in value required for traded assets',
  path: ['tradeInValue'],
});

// Query Validators
export const listAssetsQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().positive()).default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(1000)).default('20'),
  search: z.string().optional(),
  status: z.enum(['active', 'disposed', 'sold', 'scrapped', 'stolen', 'lost', 'under_maintenance', 'inactive']).optional(),
  categoryId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  acquisitionDateFrom: z.string().optional(),
  acquisitionDateTo: z.string().optional(),
  sortBy: z.enum(['assetNumber', 'assetName', 'acquisitionDate', 'bookValue']).default('assetNumber'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const listDepreciationsQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().positive()).default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(1000)).default('20'),
  assetId: z.string().uuid().optional(),
  fiscalPeriodId: z.string().uuid().optional(),
  status: z.enum(['calculated', 'posted', 'reversed']).optional(),
});

export const listMovementsQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().positive()).default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(1000)).default('20'),
  assetId: z.string().uuid().optional(),
  movementType: z.enum(['transfer', 'assignment', 'return', 'relocation']).optional(),
  status: z.enum(['draft', 'approved', 'completed', 'cancelled']).optional(),
});

export const listMaintenancesQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().positive()).default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(1000)).default('20'),
  assetId: z.string().uuid().optional(),
  maintenanceType: z.enum(['preventive', 'corrective', 'breakdown', 'inspection', 'calibration']).optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const listDisposalsQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().positive()).default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(1000)).default('20'),
  disposalMethod: z.enum(['sold', 'scrapped', 'traded', 'donated', 'stolen', 'lost']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
