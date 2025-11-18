import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../sequelize';

export interface AssetMovementAttributes {
  id: string;
  companyId: string;
  assetId: string;

  // Movement Info
  movementNumber: string;
  movementDate: Date;
  movementType: 'transfer' | 'assignment' | 'return' | 'relocation';

  // From
  fromLocationId: string | null;
  fromDepartmentId: string | null;
  fromUserId: string | null;

  // To
  toLocationId: string | null;
  toDepartmentId: string | null;
  toUserId: string | null;

  // Reason & Notes
  reason: string | null;
  notes: string | null;

  // Approval
  requiresApproval: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected' | null;
  approvedBy: string | null;
  approvedAt: Date | null;

  // Status
  status: 'draft' | 'approved' | 'completed' | 'cancelled';

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface AssetMovementCreationAttributes
  extends Optional<
    AssetMovementAttributes,
    | 'id'
    | 'fromLocationId'
    | 'fromDepartmentId'
    | 'fromUserId'
    | 'toLocationId'
    | 'toDepartmentId'
    | 'toUserId'
    | 'reason'
    | 'notes'
    | 'requiresApproval'
    | 'approvalStatus'
    | 'approvedBy'
    | 'approvedAt'
    | 'status'
    | 'createdAt'
    | 'updatedAt'
    | 'updatedBy'
  > {}

class AssetMovement
  extends Model<AssetMovementAttributes, AssetMovementCreationAttributes>
  implements AssetMovementAttributes
{
  public id!: string;
  public companyId!: string;
  public assetId!: string;

  public movementNumber!: string;
  public movementDate!: Date;
  public movementType!: 'transfer' | 'assignment' | 'return' | 'relocation';

  public fromLocationId!: string | null;
  public fromDepartmentId!: string | null;
  public fromUserId!: string | null;

  public toLocationId!: string | null;
  public toDepartmentId!: string | null;
  public toUserId!: string | null;

  public reason!: string | null;
  public notes!: string | null;

  public requiresApproval!: boolean;
  public approvalStatus!: 'pending' | 'approved' | 'rejected' | null;
  public approvedBy!: string | null;
  public approvedAt!: Date | null;

  public status!: 'draft' | 'approved' | 'completed' | 'cancelled';

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public createdBy!: string;
  public updatedBy!: string;
}

AssetMovement.init(
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
    movementNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    movementDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    movementType: {
      type: DataTypes.ENUM('transfer', 'assignment', 'return', 'relocation'),
      allowNull: false,
    },
    fromLocationId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'asset_locations',
        key: 'id',
      },
    },
    fromDepartmentId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    fromUserId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    toLocationId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'asset_locations',
        key: 'id',
      },
    },
    toDepartmentId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    toUserId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
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
    requiresApproval: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    approvalStatus: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
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
    status: {
      type: DataTypes.ENUM('draft', 'approved', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'draft',
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
    tableName: 'asset_movements',
    timestamps: true,
    indexes: [
      {
        fields: ['company_id', 'asset_id'],
      },
      {
        fields: ['company_id', 'movement_date'],
      },
      {
        fields: ['company_id', 'status'],
      },
    ],
  }
);

export default AssetMovement;
