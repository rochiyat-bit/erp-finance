import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../sequelize';

export interface PaymentAllocationAttributes {
  id: string;
  companyId: string;
  billPaymentId: string;
  billId: string;

  // Allocation Details
  allocationAmount: number;
  discountTaken: number; // Early payment discount
  writeOffAmount: number; // Small differences written off
  totalApplied: number; // allocationAmount + discountTaken + writeOffAmount

  // GL Accounts for discount and write-off
  discountAccountId: string | null;
  writeOffAccountId: string | null;

  // Allocation Date
  allocationDate: Date;

  // Status
  isVoided: boolean;
  voidedBy: string | null;
  voidedAt: Date | null;
  voidReason: string | null;

  // Additional Information
  notes: string | null;

  // Metadata
  createdBy: string;
  updatedBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PaymentAllocationCreationAttributes extends Optional<PaymentAllocationAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class PaymentAllocation extends Model<PaymentAllocationAttributes, PaymentAllocationCreationAttributes> implements PaymentAllocationAttributes {
  declare id: string;
  declare companyId: string;
  declare billPaymentId: string;
  declare billId: string;

  declare allocationAmount: number;
  declare discountTaken: number;
  declare writeOffAmount: number;
  declare totalApplied: number;

  declare discountAccountId: string | null;
  declare writeOffAccountId: string | null;

  declare allocationDate: Date;

  declare isVoided: boolean;
  declare voidedBy: string | null;
  declare voidedAt: Date | null;
  declare voidReason: string | null;

  declare notes: string | null;

  declare createdBy: string;
  declare updatedBy: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

PaymentAllocation.init(
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
      onDelete: 'CASCADE',
    },
    billPaymentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'bill_payments',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    billId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'bills',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    allocationAmount: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: false,
      defaultValue: 0,
    },
    discountTaken: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: false,
      defaultValue: 0,
    },
    writeOffAmount: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: false,
      defaultValue: 0,
    },
    totalApplied: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: false,
      defaultValue: 0,
    },
    discountAccountId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'chart_of_accounts',
        key: 'id',
      },
    },
    writeOffAccountId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'chart_of_accounts',
        key: 'id',
      },
    },
    allocationDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    isVoided: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    voidedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    voidedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    voidReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'payment_allocations',
    timestamps: true,
    indexes: [
      {
        fields: ['companyId'],
      },
      {
        fields: ['billPaymentId'],
      },
      {
        fields: ['billId'],
      },
      {
        unique: true,
        fields: ['billPaymentId', 'billId'],
        where: {
          isVoided: false,
        },
      },
    ],
  }
);

export default PaymentAllocation;
