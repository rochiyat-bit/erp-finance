import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../sequelize';

export interface AssetRevaluationAttributes {
  id: string;
  companyId: string;
  assetId: string;

  // Revaluation Info
  revaluationNumber: string;
  revaluationDate: Date;
  revaluationMethod: 'market_value' | 'replacement_cost' | 'professional_appraisal' | 'indexed';

  // Values
  previousBookValue: number;
  revaluedAmount: number;
  revaluationGainLoss: number;

  // Appraisal
  appraiserId: string | null;
  appraiserName: string | null;
  appraisalReport: string | null;

  // GL Integration
  isPosted: boolean;
  postedAt: Date | null;
  journalEntryId: string | null;

  // Revaluation Reserve
  revaluationReserveAccountId: string | null;

  reason: string | null;
  notes: string | null;

  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface AssetRevaluationCreationAttributes
  extends Optional<
    AssetRevaluationAttributes,
    | 'id'
    | 'appraiserId'
    | 'appraiserName'
    | 'appraisalReport'
    | 'isPosted'
    | 'postedAt'
    | 'journalEntryId'
    | 'revaluationReserveAccountId'
    | 'reason'
    | 'notes'
    | 'createdAt'
    | 'updatedAt'
    | 'updatedBy'
  > {}

class AssetRevaluation
  extends Model<AssetRevaluationAttributes, AssetRevaluationCreationAttributes>
  implements AssetRevaluationAttributes
{
  public id!: string;
  public companyId!: string;
  public assetId!: string;

  public revaluationNumber!: string;
  public revaluationDate!: Date;
  public revaluationMethod!: 'market_value' | 'replacement_cost' | 'professional_appraisal' | 'indexed';

  public previousBookValue!: number;
  public revaluedAmount!: number;
  public revaluationGainLoss!: number;

  public appraiserId!: string | null;
  public appraiserName!: string | null;
  public appraisalReport!: string | null;

  public isPosted!: boolean;
  public postedAt!: Date | null;
  public journalEntryId!: string | null;

  public revaluationReserveAccountId!: string | null;

  public reason!: string | null;
  public notes!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public createdBy!: string;
  public updatedBy!: string;
}

AssetRevaluation.init(
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
    revaluationNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    revaluationDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    revaluationMethod: {
      type: DataTypes.ENUM('market_value', 'replacement_cost', 'professional_appraisal', 'indexed'),
      allowNull: false,
    },
    previousBookValue: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
    },
    revaluedAmount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
    },
    revaluationGainLoss: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
    },
    appraiserId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    appraiserName: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    appraisalReport: {
      type: DataTypes.STRING(500),
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
    journalEntryId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'journal_entries',
        key: 'id',
      },
    },
    revaluationReserveAccountId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'chart_of_accounts',
        key: 'id',
      },
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    tableName: 'asset_revaluations',
    timestamps: true,
    indexes: [
      {
        fields: ['company_id', 'asset_id'],
      },
      {
        fields: ['company_id', 'revaluation_date'],
      },
    ],
  }
);

export default AssetRevaluation;
