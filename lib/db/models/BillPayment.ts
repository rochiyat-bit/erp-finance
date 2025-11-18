import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../sequelize';

export interface BillPaymentAttributes {
  id: string;
  companyId: string;
  vendorId: string;

  // Payment Numbers
  paymentNumber: string; // Auto-generated: PAY-2024-00001
  referenceNumber: string | null;
  checkNumber: string | null;

  // Payment Details
  paymentDate: Date;
  postingDate: Date | null;
  paymentMethod: 'check' | 'bank_transfer' | 'cash' | 'credit_card' | 'debit_card' | 'online' | 'other';

  // Status
  status: 'draft' | 'pending' | 'approved' | 'posted' | 'cleared' | 'cancelled' | 'voided';
  isPosted: boolean;
  isCleared: boolean;
  clearedDate: Date | null;

  // Financial Details
  currencyCode: string;
  exchangeRate: number;
  paymentAmount: number; // Total payment amount
  allocatedAmount: number; // Amount allocated to bills
  unappliedAmount: number; // Unallocated amount (credit balance)

  // Bank Account
  bankAccountId: string; // Cash/Bank account to credit
  bankAccountCode: string;
  bankAccountName: string;

  // AP Account
  apAccountId: string; // AP control account to debit

  // GL Integration
  journalEntryId: string | null;

  // Approval Workflow
  requiresApproval: boolean;
  approvedBy: string | null;
  approvedAt: Date | null;

  // Additional Information
  description: string | null;
  notes: string | null;
  internalNotes: string | null;
  attachments: string[];

  // Payee Details
  payeeName: string;
  payeeAddress: string | null;

  // Metadata
  createdBy: string;
  updatedBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BillPaymentCreationAttributes extends Optional<BillPaymentAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class BillPayment extends Model<BillPaymentAttributes, BillPaymentCreationAttributes> implements BillPaymentAttributes {
  declare id: string;
  declare companyId: string;
  declare vendorId: string;

  declare paymentNumber: string;
  declare referenceNumber: string | null;
  declare checkNumber: string | null;

  declare paymentDate: Date;
  declare postingDate: Date | null;
  declare paymentMethod: 'check' | 'bank_transfer' | 'cash' | 'credit_card' | 'debit_card' | 'online' | 'other';

  declare status: 'draft' | 'pending' | 'approved' | 'posted' | 'cleared' | 'cancelled' | 'voided';
  declare isPosted: boolean;
  declare isCleared: boolean;
  declare clearedDate: Date | null;

  declare currencyCode: string;
  declare exchangeRate: number;
  declare paymentAmount: number;
  declare allocatedAmount: number;
  declare unappliedAmount: number;

  declare bankAccountId: string;
  declare bankAccountCode: string;
  declare bankAccountName: string;

  declare apAccountId: string;
  declare journalEntryId: string | null;

  declare requiresApproval: boolean;
  declare approvedBy: string | null;
  declare approvedAt: Date | null;

  declare description: string | null;
  declare notes: string | null;
  declare internalNotes: string | null;
  declare attachments: string[];

  declare payeeName: string;
  declare payeeAddress: string | null;

  declare createdBy: string;
  declare updatedBy: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

BillPayment.init(
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
    vendorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'vendors',
        key: 'id',
      },
    },
    paymentNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: false, // Unique per company
    },
    referenceNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    checkNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    postingDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    paymentMethod: {
      type: DataTypes.ENUM('check', 'bank_transfer', 'cash', 'credit_card', 'debit_card', 'online', 'other'),
      allowNull: false,
      defaultValue: 'bank_transfer',
    },
    status: {
      type: DataTypes.ENUM('draft', 'pending', 'approved', 'posted', 'cleared', 'cancelled', 'voided'),
      allowNull: false,
      defaultValue: 'draft',
    },
    isPosted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isCleared: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    clearedDate: {
      type: DataTypes.DATE,
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
    bankAccountId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'chart_of_accounts',
        key: 'id',
      },
    },
    bankAccountCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    bankAccountName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    apAccountId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'chart_of_accounts',
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
    requiresApproval: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
    description: {
      type: DataTypes.TEXT,
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
    attachments: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    payeeName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    payeeAddress: {
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
    tableName: 'bill_payments',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['companyId', 'paymentNumber'],
      },
      {
        fields: ['companyId', 'vendorId'],
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

export default BillPayment;
