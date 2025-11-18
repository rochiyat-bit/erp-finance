import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../sequelize';

export interface AssetDepreciationAttributes {
  id: string;
  companyId: string;
  assetId: string;

  // Period Info
  fiscalYearId: string;
  fiscalPeriodId: string;
  depreciationDate: Date;

  // Depreciation Calculation
  openingBookValue: number;
  depreciationAmount: number;
  accumulatedDepreciation: number;
  closingBookValue: number;

  // Method Info
  depreciationMethod: string;
  calculationBasis: string | null;

  // Units of Production specific
  unitsProduced: number | null;

  // GL Integration
  isPosted: boolean;
  postedAt: Date | null;
  postedBy: string | null;
  journalEntryId: string | null;

  // Status
  status: 'calculated' | 'posted' | 'reversed';

  // Reversal
  isReversed: boolean;
  reversedAt: Date | null;
  reversedBy: string | null;
  reversalJournalEntryId: string | null;

  notes: string | null;

  createdAt: Date;
  createdBy: string;
}

export interface AssetDepreciationCreationAttributes
  extends Optional<
    AssetDepreciationAttributes,
    | 'id'
    | 'calculationBasis'
    | 'unitsProduced'
    | 'isPosted'
    | 'postedAt'
    | 'postedBy'
    | 'journalEntryId'
    | 'status'
    | 'isReversed'
    | 'reversedAt'
    | 'reversedBy'
    | 'reversalJournalEntryId'
    | 'notes'
    | 'createdAt'
  > {}

class AssetDepreciation
  extends Model<AssetDepreciationAttributes, AssetDepreciationCreationAttributes>
  implements AssetDepreciationAttributes
{
  public id!: string;
  public companyId!: string;
  public assetId!: string;

  public fiscalYearId!: string;
  public fiscalPeriodId!: string;
  public depreciationDate!: Date;

  public openingBookValue!: number;
  public depreciationAmount!: number;
  public accumulatedDepreciation!: number;
  public closingBookValue!: number;

  public depreciationMethod!: string;
  public calculationBasis!: string | null;

  public unitsProduced!: number | null;

  public isPosted!: boolean;
  public postedAt!: Date | null;
  public postedBy!: string | null;
  public journalEntryId!: string | null;

  public status!: 'calculated' | 'posted' | 'reversed';

  public isReversed!: boolean;
  public reversedAt!: Date | null;
  public reversedBy!: string | null;
  public reversalJournalEntryId!: string | null;

  public notes!: string | null;

  public readonly createdAt!: Date;
  public createdBy!: string;
}

AssetDepreciation.init(
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
    assetId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'fixed_assets',
        key: 'id',
      },
    },
    fiscalYearId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'fiscal_years',
        key: 'id',
      },
    },
    fiscalPeriodId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'fiscal_periods',
        key: 'id',
      },
    },
    depreciationDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    openingBookValue: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
    },
    depreciationAmount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
    },
    accumulatedDepreciation: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
    },
    closingBookValue: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
    },
    depreciationMethod: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    calculationBasis: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    unitsProduced: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    isPosted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    postedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    postedBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    journalEntryId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'journal_entries',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('calculated', 'posted', 'reversed'),
      allowNull: false,
      defaultValue: 'calculated',
    },
    isReversed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    reversedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reversedBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    reversalJournalEntryId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'journal_entries',
        key: 'id',
      },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'asset_depreciations',
    timestamps: false,
    indexes: [
      {
        fields: ['company_id', 'asset_id'],
      },
      {
        fields: ['company_id', 'fiscal_period_id'],
      },
      {
        fields: ['company_id', 'is_posted'],
      },
      {
        fields: ['company_id', 'depreciation_date'],
      },
    ],
  }
);

export default AssetDepreciation;
