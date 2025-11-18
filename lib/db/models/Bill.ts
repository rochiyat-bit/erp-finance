import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../sequelize';

export interface BillAttributes {
  id: string;
  companyId: string;
  vendorId: string;

  // Document Numbers
  billNumber: string; // Auto-generated: BILL-2024-00001
  vendorInvoiceNumber: string; // Vendor's invoice number
  referenceNumber: string | null;
  purchaseOrderId: string | null; // Link to PO if exists

  // Document Type and Status
  documentType: 'standard' | 'credit_note' | 'debit_note' | 'prepayment';
  status: 'draft' | 'pending_approval' | 'approved' | 'posted' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';

  // Dates
  billDate: Date;
  dueDate: Date;
  postingDate: Date | null;
  receivedDate: Date | null;

  // Financial Details
  currencyCode: string;
  exchangeRate: number;

  // Amounts
  subtotalAmount: number;
  taxAmount: number;
  discountAmount: number;
  shippingAmount: number;
  otherCharges: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;

  // GL Integration
  apAccountId: string; // AP control account
  journalEntryId: string | null; // Link to posted JE
  isPosted: boolean;

  // Approval Workflow
  requiresApproval: boolean;
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectedBy: string | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;

  // Payment Information
  paymentTerms: string;
  paymentTermDays: number;
  earlyPaymentDiscount: number;
  discountDueDate: Date | null;

  // Additional Information
  description: string | null;
  notes: string | null;
  internalNotes: string | null;
  attachments: string[];
  tags: string[];

  // Matching and Reconciliation
  isReconciled: boolean;
  reconciledBy: string | null;
  reconciledAt: Date | null;
  goodsReceiptId: string | null; // Link to GR for 3-way matching

  // Metadata
  createdBy: string;
  updatedBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BillCreationAttributes extends Optional<BillAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Bill extends Model<BillAttributes, BillCreationAttributes> implements BillAttributes {
  declare id: string;
  declare companyId: string;
  declare vendorId: string;

  declare billNumber: string;
  declare vendorInvoiceNumber: string;
  declare referenceNumber: string | null;
  declare purchaseOrderId: string | null;

  declare documentType: 'standard' | 'credit_note' | 'debit_note' | 'prepayment';
  declare status: 'draft' | 'pending_approval' | 'approved' | 'posted' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';

  declare billDate: Date;
  declare dueDate: Date;
  declare postingDate: Date | null;
  declare receivedDate: Date | null;

  declare currencyCode: string;
  declare exchangeRate: number;

  declare subtotalAmount: number;
  declare taxAmount: number;
  declare discountAmount: number;
  declare shippingAmount: number;
  declare otherCharges: number;
  declare totalAmount: number;
  declare paidAmount: number;
  declare outstandingAmount: number;

  declare apAccountId: string;
  declare journalEntryId: string | null;
  declare isPosted: boolean;

  declare requiresApproval: boolean;
  declare approvedBy: string | null;
  declare approvedAt: Date | null;
  declare rejectedBy: string | null;
  declare rejectedAt: Date | null;
  declare rejectionReason: string | null;

  declare paymentTerms: string;
  declare paymentTermDays: number;
  declare earlyPaymentDiscount: number;
  declare discountDueDate: Date | null;

  declare description: string | null;
  declare notes: string | null;
  declare internalNotes: string | null;
  declare attachments: string[];
  declare tags: string[];

  declare isReconciled: boolean;
  declare reconciledBy: string | null;
  declare reconciledAt: Date | null;
  declare goodsReceiptId: string | null;

  declare createdBy: string;
  declare updatedBy: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Bill.init(
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
    billNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: false, // Unique per company
    },
    vendorInvoiceNumber: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    referenceNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    purchaseOrderId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    documentType: {
      type: DataTypes.ENUM('standard', 'credit_note', 'debit_note', 'prepayment'),
      allowNull: false,
      defaultValue: 'standard',
    },
    status: {
      type: DataTypes.ENUM('draft', 'pending_approval', 'approved', 'posted', 'partially_paid', 'paid', 'overdue', 'cancelled'),
      allowNull: false,
      defaultValue: 'draft',
    },
    billDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    postingDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    receivedDate: {
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
    subtotalAmount: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: false,
      defaultValue: 0,
    },
    taxAmount: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: false,
      defaultValue: 0,
    },
    discountAmount: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: false,
      defaultValue: 0,
    },
    shippingAmount: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: false,
      defaultValue: 0,
    },
    otherCharges: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: false,
      defaultValue: 0,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: false,
      defaultValue: 0,
    },
    paidAmount: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: false,
      defaultValue: 0,
    },
    outstandingAmount: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: false,
      defaultValue: 0,
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
    isPosted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
    rejectedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    rejectedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    paymentTerms: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Net 30',
    },
    paymentTermDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
    },
    earlyPaymentDiscount: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    discountDueDate: {
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
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    isReconciled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    reconciledBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    reconciledAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    goodsReceiptId: {
      type: DataTypes.UUID,
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
    tableName: 'bills',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['companyId', 'billNumber'],
      },
      {
        fields: ['companyId', 'vendorId'],
      },
      {
        fields: ['companyId', 'status'],
      },
      {
        fields: ['companyId', 'dueDate'],
      },
      {
        fields: ['vendorInvoiceNumber'],
      },
      {
        fields: ['journalEntryId'],
      },
    ],
  }
);

export default Bill;
