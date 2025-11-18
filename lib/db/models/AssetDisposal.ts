import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../sequelize';

export interface AssetDisposalAttributes {
  id: string;
  companyId: string;
  assetId: string;

  // Disposal Info
  disposalNumber: string;
  disposalDate: Date;
  disposalMethod: 'sold' | 'scrapped' | 'traded' | 'donated' | 'stolen' | 'lost';

  // Asset Values at Disposal
  originalCost: number;
  accumulatedDepreciation: number;
  bookValue: number;

  // Sale Details
  saleAmount: number | null;
  buyerId: string | null;
  invoiceId: string | null;

  // Trade-in Details
  tradeInValue: number | null;
  newAssetId: string | null;

  // Costs
  disposalCosts: number;

  // Gain/Loss Calculation
  totalProceeds: number;
  gainLoss: number;
  gainLossType: 'gain' | 'loss' | 'break_even';

  // GL Integration
  isPosted: boolean;
  postedAt: Date | null;
  journalEntryId: string | null;

  // Additional Info
  reason: string | null;
  notes: string | null;
  approvedBy: string | null;
  approvedAt: Date | null;

  attachments: string[] | null;

  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface AssetDisposalCreationAttributes
  extends Optional<
    AssetDisposalAttributes,
    | 'id'
    | 'saleAmount'
    | 'buyerId'
    | 'invoiceId'
    | 'tradeInValue'
    | 'newAssetId'
    | 'disposalCosts'
    | 'isPosted'
    | 'postedAt'
    | 'journalEntryId'
    | 'reason'
    | 'notes'
    | 'approvedBy'
    | 'approvedAt'
    | 'attachments'
    | 'createdAt'
    | 'updatedAt'
    | 'updatedBy'
  > {}

class AssetDisposal
  extends Model<AssetDisposalAttributes, AssetDisposalCreationAttributes>
  implements AssetDisposalAttributes
{
  public id!: string;
  public companyId!: string;
  public assetId!: string;

  public disposalNumber!: string;
  public disposalDate!: Date;
  public disposalMethod!: 'sold' | 'scrapped' | 'traded' | 'donated' | 'stolen' | 'lost';

  public originalCost!: number;
  public accumulatedDepreciation!: number;
  public bookValue!: number;

  public saleAmount!: number | null;
  public buyerId!: string | null;
  public invoiceId!: string | null;

  public tradeInValue!: number | null;
  public newAssetId!: string | null;

  public disposalCosts!: number;

  public totalProceeds!: number;
  public gainLoss!: number;
  public gainLossType!: 'gain' | 'loss' | 'break_even';

  public isPosted!: boolean;
  public postedAt!: Date | null;
  public journalEntryId!: string | null;

  public reason!: string | null;
  public notes!: string | null;
  public approvedBy!: string | null;
  public approvedAt!: Date | null;

  public attachments!: string[] | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public createdBy!: string;
  public updatedBy!: string;
}

AssetDisposal.init(
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
    disposalNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    disposalDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    disposalMethod: {
      type: DataTypes.ENUM('sold', 'scrapped', 'traded', 'donated', 'stolen', 'lost'),
      allowNull: false,
    },
    originalCost: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
    },
    accumulatedDepreciation: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
    },
    bookValue: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
    },
    saleAmount: {
      type: DataTypes.DECIMAL(18, 2),
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
    tradeInValue: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    newAssetId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'fixed_assets',
        key: 'id',
      },
    },
    disposalCosts: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    totalProceeds: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
    },
    gainLoss: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
    },
    gainLossType: {
      type: DataTypes.ENUM('gain', 'loss', 'break_even'),
      allowNull: false,
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
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    approvedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    attachments: {
      type: DataTypes.ARRAY(DataTypes.STRING),
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
    tableName: 'asset_disposals',
    timestamps: true,
    indexes: [
      {
        fields: ['company_id', 'asset_id'],
      },
      {
        fields: ['company_id', 'disposal_date'],
      },
    ],
  }
);

export default AssetDisposal;
