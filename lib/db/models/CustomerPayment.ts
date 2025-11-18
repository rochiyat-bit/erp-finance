import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../sequelize';

export interface CustomerPaymentAttributes {
  id: string;
  companyId: string;

  // Payment Number & Reference
  paymentNumber: string; // Auto-generated: RCP-2024-00001
  referenceNumber: string | null;
  checkNumber: string | null;
  transactionId: string | null;

  // Customer
  customerId: string;
  customerName: string;

  // Payment Details
  paymentDate: Date;
  paymentMethod: 'cash' | 'check' | 'bank_transfer' | 'credit_card' | 'debit_card' | 'e_wallet' | 'other';

  // Bank Account
  bankAccountId: string | null;
  bankAccountCode: string | null;
  bankAccountName: string | null;

  // Financial
  currencyCode: string;
  exchangeRate: number;
  paymentAmount: number;

  // Allocation
  allocatedAmount: number;
  unappliedAmount: number;

  // Status
  status: 'draft' | 'approved' | 'posted' | 'void' | 'reconciled';

  // GL Integration
  isPosted: boolean;
  postedAt: Date | null;
  postedBy: string | null;
  journalEntryId: string | null;

  // Additional Info
  description: string | null;
  notes: string | null;

  // Metadata
  createdBy: string;
  updatedBy: string;
  createdAt?: Date;
  updatedAt?: Date;

  // Void
  isVoid: boolean;
  voidedAt: Date | null;
  voidedBy: string | null;
  voidReason: string | null;
}

export interface CustomerPaymentCreationAttributes extends Optional<CustomerPaymentAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class CustomerPayment extends Model<CustomerPaymentAttributes, CustomerPaymentCreationAttributes> implements CustomerPaymentAttributes {
  declare id: string;
  declare companyId: string;

  declare paymentNumber: string;
  declare referenceNumber: string | null;
  declare checkNumber: string | null;
  declare transactionId: string | null;

  declare customerId: string;
  declare customerName: string;

  declare paymentDate: Date;
  declare paymentMethod: 'cash' | 'check' | 'bank_transfer' | 'credit_card' | 'debit_card' | 'e_wallet' | 'other';

  declare bankAccountId: string | null;
  declare bankAccountCode: string | null;
  declare bankAccountName: string | null;

  declare currencyCode: string;
  declare exchangeRate: number;
  declare paymentAmount: number;

  declare allocatedAmount: number;
  declare unappliedAmount: number;

  declare status: 'draft' | 'approved' | 'posted' | 'void' | 'reconciled';

  declare isPosted: boolean;
  declare postedAt: Date | null;
  declare postedBy: string | null;
  declare journalEntryId: string | null;

  declare description: string | null;
  declare notes: string | null;

  declare createdBy: string;
  declare updatedBy: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  declare isVoid: boolean;
  declare voidedAt: Date | null;
  declare voidedBy: string | null;
  declare voidReason: string | null;
}

CustomerPayment.init(
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
    paymentNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: false,
    },
    referenceNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    checkNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    transactionId: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id',
      },
    },
    customerName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.ENUM('cash', 'check', 'bank_transfer', 'credit_card', 'debit_card', 'e_wallet', 'other'),
      allowNull: false,
      defaultValue: 'bank_transfer',
    },
    bankAccountId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'chart_of_accounts',
        key: 'id',
      },
    },
    bankAccountCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    bankAccountName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    currencyCode: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
    },
    exchangeRate: {
      type: DataTypes.DECIMAL(19, 6),
      allowNull: false,
      defaultValue: 1,
    },
    paymentAmount: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: false,
      defaultValue: 0,
    },
    allocatedAmount: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: false,
      defaultValue: 0,
    },
    unappliedAmount: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('draft', 'approved', 'posted', 'void', 'reconciled'),
      allowNull: false,
      defaultValue: 'draft',
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
      references: {
        model: 'users',
        key: 'id',
      },
    },
    journalEntryId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'journal_entries',
        key: 'id',
      },
    },
    description: {
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
    isVoid: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    voidedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    voidedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    voidReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'customer_payments',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['companyId', 'paymentNumber'],
      },
      {
        fields: ['companyId', 'customerId'],
      },
      {
        fields: ['companyId', 'status'],
      },
      {
        fields: ['companyId', 'paymentDate'],
      },
      {
        fields: ['journalEntryId'],
      },
    ],
  }
);

export default CustomerPayment;
