import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../sequelize';

export interface AssetCategoryAttributes {
  id: string;
  companyId: string;

  // Category Info
  categoryCode: string;
  categoryName: string;
  description: string | null;

  // Hierarchy
  parentCategoryId: string | null;
  level: number;

  // Default GL Accounts
  assetAccountId: string;
  accumulatedDepreciationAccountId: string;
  depreciationExpenseAccountId: string;
  disposalGainAccountId: string | null;
  disposalLossAccountId: string | null;

  // Default Depreciation Settings
  defaultDepreciationMethod: 'straight_line' | 'declining_balance' | 'sum_of_years' | 'units_of_production' | 'manual';
  defaultUsefulLifeYears: number | null;
  defaultUsefulLifeMonths: number | null;
  defaultSalvageValuePercent: number | null;
  defaultDepreciationRate: number | null;

  // Settings
  requiresInsurance: boolean;
  requiresMaintenance: boolean;
  isActive: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface AssetCategoryCreationAttributes
  extends Optional<
    AssetCategoryAttributes,
    | 'id'
    | 'description'
    | 'parentCategoryId'
    | 'level'
    | 'disposalGainAccountId'
    | 'disposalLossAccountId'
    | 'defaultUsefulLifeYears'
    | 'defaultUsefulLifeMonths'
    | 'defaultSalvageValuePercent'
    | 'defaultDepreciationRate'
    | 'requiresInsurance'
    | 'requiresMaintenance'
    | 'isActive'
    | 'createdAt'
    | 'updatedAt'
    | 'updatedBy'
  > {}

class AssetCategory
  extends Model<AssetCategoryAttributes, AssetCategoryCreationAttributes>
  implements AssetCategoryAttributes
{
  public id!: string;
  public companyId!: string;

  public categoryCode!: string;
  public categoryName!: string;
  public description!: string | null;

  public parentCategoryId!: string | null;
  public level!: number;

  public assetAccountId!: string;
  public accumulatedDepreciationAccountId!: string;
  public depreciationExpenseAccountId!: string;
  public disposalGainAccountId!: string | null;
  public disposalLossAccountId!: string | null;

  public defaultDepreciationMethod!: 'straight_line' | 'declining_balance' | 'sum_of_years' | 'units_of_production' | 'manual';
  public defaultUsefulLifeYears!: number | null;
  public defaultUsefulLifeMonths!: number | null;
  public defaultSalvageValuePercent!: number | null;
  public defaultDepreciationRate!: number | null;

  public requiresInsurance!: boolean;
  public requiresMaintenance!: boolean;
  public isActive!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public createdBy!: string;
  public updatedBy!: string;
}

AssetCategory.init(
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
    categoryCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    categoryName: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    parentCategoryId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'asset_categories',
        key: 'id',
      },
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
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
    disposalGainAccountId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'chart_of_accounts',
        key: 'id',
      },
    },
    disposalLossAccountId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'chart_of_accounts',
        key: 'id',
      },
    },
    defaultDepreciationMethod: {
      type: DataTypes.ENUM('straight_line', 'declining_balance', 'sum_of_years', 'units_of_production', 'manual'),
      allowNull: false,
      defaultValue: 'straight_line',
    },
    defaultUsefulLifeYears: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    defaultUsefulLifeMonths: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    defaultSalvageValuePercent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    defaultDepreciationRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    requiresInsurance: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    requiresMaintenance: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
  },
  {
    sequelize,
    tableName: 'asset_categories',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['company_id', 'category_code'],
      },
      {
        fields: ['company_id', 'is_active'],
      },
      {
        fields: ['parent_category_id'],
      },
    ],
  }
);

export default AssetCategory;
