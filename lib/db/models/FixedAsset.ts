import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../sequelize';

export interface FixedAssetAttributes {
  id: string;
  companyId: string;

  // Asset Identification
  assetNumber: string;
  assetName: string;
  description: string | null;
  barcode: string | null;
  serialNumber: string | null;
  model: string | null;
  manufacturer: string | null;

  // Classification
  assetCategoryId: string;
  assetType: 'tangible' | 'intangible';
  assetClass: 'property' | 'building' | 'machinery' | 'vehicle' | 'furniture' | 'equipment' | 'software' | 'other';

  // Location & Assignment
  locationId: string | null;
  departmentId: string | null;
  assignedToUserId: string | null;

  // Acquisition Details
  acquisitionDate: Date;
  purchaseDate: Date | null;
  vendorId: string | null;
  purchaseOrderId: string | null;
  billId: string | null;

  // Financial - Cost
  acquisitionCost: number;
  additionalCosts: number;
  totalCost: number;
  currencyCode: string;
  exchangeRate: number;

  // Financial - Salvage Value
  salvageValue: number;
  salvageValuePercent: number | null;

  // Depreciation Settings
  depreciationMethod: 'straight_line' | 'declining_balance' | 'sum_of_years' | 'units_of_production' | 'manual';
  usefulLifeYears: number | null;
  usefulLifeMonths: number | null;
  depreciationRate: number | null;
  unitsOfProductionTotal: number | null;

  // Depreciation Start
  depreciationStartDate: Date | null;
  firstDepreciationAmount: number | null;

  // Current Values
  bookValue: number;
  accumulatedDepreciation: number;
  remainingValue: number;

  // Status
  status: 'active' | 'disposed' | 'sold' | 'scrapped' | 'stolen' | 'lost' | 'under_maintenance' | 'inactive';

  // GL Accounts
  assetAccountId: string;
  accumulatedDepreciationAccountId: string;
  depreciationExpenseAccountId: string;

  // Warranty & Insurance
  warrantyStartDate: Date | null;
  warrantyEndDate: Date | null;
  warrantyProvider: string | null;
  insurancePolicyNumber: string | null;
  insuranceProvider: string | null;
  insuranceStartDate: Date | null;
  insuranceEndDate: Date | null;
  insuranceCoverageAmount: number | null;

  // Maintenance
  lastMaintenanceDate: Date | null;
  nextMaintenanceDate: Date | null;
  maintenanceFrequencyDays: number | null;

  // Disposal Details
  disposalDate: Date | null;
  disposalMethod: 'sold' | 'scrapped' | 'traded' | 'donated' | 'stolen' | 'lost' | null;
  disposalAmount: number | null;
  disposalCosts: number | null;
  disposalGainLoss: number | null;
  disposalNotes: string | null;
  buyerId: string | null;
  invoiceId: string | null;

  // Revaluation
  isRevalued: boolean;
  revaluationDate: Date | null;
  revaluationAmount: number | null;

  // Additional Info
  notes: string | null;
  internalNotes: string | null;
  tags: string[] | null;

  // Attachments
  attachments: string[] | null;
  photo: string | null;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;

  fiscalYearId: string | null;
}

export interface FixedAssetCreationAttributes
  extends Optional<
    FixedAssetAttributes,
    | 'id'
    | 'description'
    | 'barcode'
    | 'serialNumber'
    | 'model'
    | 'manufacturer'
    | 'locationId'
    | 'departmentId'
    | 'assignedToUserId'
    | 'purchaseDate'
    | 'vendorId'
    | 'purchaseOrderId'
    | 'billId'
    | 'additionalCosts'
    | 'salvageValuePercent'
    | 'usefulLifeYears'
    | 'usefulLifeMonths'
    | 'depreciationRate'
    | 'unitsOfProductionTotal'
    | 'depreciationStartDate'
    | 'firstDepreciationAmount'
    | 'bookValue'
    | 'accumulatedDepreciation'
    | 'remainingValue'
    | 'status'
    | 'warrantyStartDate'
    | 'warrantyEndDate'
    | 'warrantyProvider'
    | 'insurancePolicyNumber'
    | 'insuranceProvider'
    | 'insuranceStartDate'
    | 'insuranceEndDate'
    | 'insuranceCoverageAmount'
    | 'lastMaintenanceDate'
    | 'nextMaintenanceDate'
    | 'maintenanceFrequencyDays'
    | 'disposalDate'
    | 'disposalMethod'
    | 'disposalAmount'
    | 'disposalCosts'
    | 'disposalGainLoss'
    | 'disposalNotes'
    | 'buyerId'
    | 'invoiceId'
    | 'isRevalued'
    | 'revaluationDate'
    | 'revaluationAmount'
    | 'notes'
    | 'internalNotes'
    | 'tags'
    | 'attachments'
    | 'photo'
    | 'createdAt'
    | 'updatedAt'
    | 'updatedBy'
    | 'fiscalYearId'
  > {}

class FixedAsset
  extends Model<FixedAssetAttributes, FixedAssetCreationAttributes>
  implements FixedAssetAttributes
{
  public id!: string;
  public companyId!: string;

  public assetNumber!: string;
  public assetName!: string;
  public description!: string | null;
  public barcode!: string | null;
  public serialNumber!: string | null;
  public model!: string | null;
  public manufacturer!: string | null;

  public assetCategoryId!: string;
  public assetType!: 'tangible' | 'intangible';
  public assetClass!: 'property' | 'building' | 'machinery' | 'vehicle' | 'furniture' | 'equipment' | 'software' | 'other';

  public locationId!: string | null;
  public departmentId!: string | null;
  public assignedToUserId!: string | null;

  public acquisitionDate!: Date;
  public purchaseDate!: Date | null;
  public vendorId!: string | null;
  public purchaseOrderId!: string | null;
  public billId!: string | null;

  public acquisitionCost!: number;
  public additionalCosts!: number;
  public totalCost!: number;
  public currencyCode!: string;
  public exchangeRate!: number;

  public salvageValue!: number;
  public salvageValuePercent!: number | null;

  public depreciationMethod!: 'straight_line' | 'declining_balance' | 'sum_of_years' | 'units_of_production' | 'manual';
  public usefulLifeYears!: number | null;
  public usefulLifeMonths!: number | null;
  public depreciationRate!: number | null;
  public unitsOfProductionTotal!: number | null;

  public depreciationStartDate!: Date | null;
  public firstDepreciationAmount!: number | null;

  public bookValue!: number;
  public accumulatedDepreciation!: number;
  public remainingValue!: number;

  public status!: 'active' | 'disposed' | 'sold' | 'scrapped' | 'stolen' | 'lost' | 'under_maintenance' | 'inactive';

  public assetAccountId!: string;
  public accumulatedDepreciationAccountId!: string;
  public depreciationExpenseAccountId!: string;

  public warrantyStartDate!: Date | null;
  public warrantyEndDate!: Date | null;
  public warrantyProvider!: string | null;
  public insurancePolicyNumber!: string | null;
  public insuranceProvider!: string | null;
  public insuranceStartDate!: Date | null;
  public insuranceEndDate!: Date | null;
  public insuranceCoverageAmount!: number | null;

  public lastMaintenanceDate!: Date | null;
  public nextMaintenanceDate!: Date | null;
  public maintenanceFrequencyDays!: number | null;

  public disposalDate!: Date | null;
  public disposalMethod!: 'sold' | 'scrapped' | 'traded' | 'donated' | 'stolen' | 'lost' | null;
  public disposalAmount!: number | null;
  public disposalCosts!: number | null;
  public disposalGainLoss!: number | null;
  public disposalNotes!: string | null;
  public buyerId!: string | null;
  public invoiceId!: string | null;

  public isRevalued!: boolean;
  public revaluationDate!: Date | null;
  public revaluationAmount!: number | null;

  public notes!: string | null;
  public internalNotes!: string | null;
  public tags!: string[] | null;

  public attachments!: string[] | null;
  public photo!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public createdBy!: string;
  public updatedBy!: string;

  public fiscalYearId!: string | null;
}

FixedAsset.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'companies',
        key: 'id',
      },
    },
    assetNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    assetName: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    barcode: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    serialNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    model: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    manufacturer: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    assetCategoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'asset_categories',
        key: 'id',
      },
    },
    assetType: {
      type: DataTypes.ENUM('tangible', 'intangible'),
      allowNull: false,
      defaultValue: 'tangible',
    },
    assetClass: {
      type: DataTypes.ENUM('property', 'building', 'machinery', 'vehicle', 'furniture', 'equipment', 'software', 'other'),
      allowNull: false,
      defaultValue: 'equipment',
    },
    locationId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'asset_locations',
        key: 'id',
      },
    },
    departmentId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    assignedToUserId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    acquisitionDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    purchaseDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    vendorId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'vendors',
        key: 'id',
      },
    },
    purchaseOrderId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    billId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'bills',
        key: 'id',
      },
    },
    acquisitionCost: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
    },
    additionalCosts: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    totalCost: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
    },
    currencyCode: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
    },
    exchangeRate: {
      type: DataTypes.DECIMAL(12, 6),
      allowNull: false,
      defaultValue: 1,
    },
    salvageValue: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    salvageValuePercent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    depreciationMethod: {
      type: DataTypes.ENUM('straight_line', 'declining_balance', 'sum_of_years', 'units_of_production', 'manual'),
      allowNull: false,
      defaultValue: 'straight_line',
    },
    usefulLifeYears: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    usefulLifeMonths: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    depreciationRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    unitsOfProductionTotal: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    depreciationStartDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    firstDepreciationAmount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    bookValue: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    accumulatedDepreciation: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    remainingValue: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('active', 'disposed', 'sold', 'scrapped', 'stolen', 'lost', 'under_maintenance', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
    },
    assetAccountId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'chart_of_accounts',
        key: 'id',
      },
    },
    accumulatedDepreciationAccountId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'chart_of_accounts',
        key: 'id',
      },
    },
    depreciationExpenseAccountId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'chart_of_accounts',
        key: 'id',
      },
    },
    warrantyStartDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    warrantyEndDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    warrantyProvider: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    insurancePolicyNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    insuranceProvider: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    insuranceStartDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    insuranceEndDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    insuranceCoverageAmount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    lastMaintenanceDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    nextMaintenanceDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    maintenanceFrequencyDays: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    disposalDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    disposalMethod: {
      type: DataTypes.ENUM('sold', 'scrapped', 'traded', 'donated', 'stolen', 'lost'),
      allowNull: true,
    },
    disposalAmount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    disposalCosts: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    disposalGainLoss: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    disposalNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    buyerId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'customers',
        key: 'id',
      },
    },
    invoiceId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'invoices',
        key: 'id',
      },
    },
    isRevalued: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    revaluationDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    revaluationAmount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    internalNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
    attachments: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
    photo: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    fiscalYearId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'fiscal_years',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'fixed_assets',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['company_id', 'asset_number'],
      },
      {
        fields: ['company_id', 'status'],
      },
      {
        fields: ['company_id', 'asset_category_id'],
      },
      {
        fields: ['company_id', 'location_id'],
      },
      {
        fields: ['company_id', 'barcode'],
      },
      {
        fields: ['company_id', 'serial_number'],
      },
      {
        fields: ['company_id', 'acquisition_date'],
      },
    ],
  }
);

export default FixedAsset;
