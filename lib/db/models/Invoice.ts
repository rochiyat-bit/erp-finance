import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../sequelize';

export interface InvoiceAttributes {
  id: string;
  companyId: string;

  // Invoice Number & Reference
  invoiceNumber: string; // Auto-generated: INV-2024-00001
  referenceNumber: string | null;
  salesOrderId: string | null;
  soNumber: string | null;
  customerPONumber: string | null;

  // Customer Info
  customerId: string;
  customerName: string;
  customerAddress: string;
  customerTaxId: string | null;

  // Dates
  invoiceDate: Date;
  dueDate: Date;
  deliveryDate: Date | null;

  // Financial
  currencyCode: string;
  exchangeRate: number;
  paymentTerms: string;
  paymentTermDays: number;

  // Amounts
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  otherCharges: number;
  totalAmount: number;

  // Payment Tracking
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'overpaid';

  // Status & Workflow
  status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'void';

  // Approval
  requiresApproval: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected' | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectionReason: string | null;

  // GL Integration
  isPosted: boolean;
  postedAt: Date | null;
  postedBy: string | null;
  journalEntryId: string | null;

  // Due Date Tracking
  daysPastDue: number;
  isOverdue: boolean;

  // Sales Info
  salesPersonId: string | null;
  salesPersonName: string | null;

  // Additional Info
  description: string | null;
  notes: string | null;
  internalNotes: string | null;
  terms: string | null;

  // Communication
  sentToCustomerAt: Date | null;
  sentToCustomerEmail: string | null;
  emailCount: number;
  lastEmailedAt: Date | null;

  // Metadata
  createdBy: string;
  updatedBy: string;
  createdAt?: Date;
  updatedAt?: Date;

  // Void tracking
  isVoid: boolean;
  voidedAt: Date | null;
  voidedBy: string | null;
  voidReason: string | null;
}

export interface InvoiceCreationAttributes extends Optional<InvoiceAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Invoice extends Model<InvoiceAttributes, InvoiceCreationAttributes> implements InvoiceAttributes {
  declare id: string;
  declare companyId: string;

  declare invoiceNumber: string;
  declare referenceNumber: string | null;
  declare salesOrderId: string | null;
  declare soNumber: string | null;
  declare customerPONumber: string | null;

  declare customerId: string;
  declare customerName: string;
  declare customerAddress: string;
  declare customerTaxId: string | null;

  declare invoiceDate: Date;
  declare dueDate: Date;
  declare deliveryDate: Date | null;

  declare currencyCode: string;
  declare exchangeRate: number;
  declare paymentTerms: string;
  declare paymentTermDays: number;

  declare subtotal: number;
  declare discountPercent: number;
  declare discountAmount: number;
  declare taxAmount: number;
  declare shippingAmount: number;
  declare otherCharges: number;
  declare totalAmount: number;

  declare paidAmount: number;
  declare balanceAmount: number;
  declare paymentStatus: 'unpaid' | 'partial' | 'paid' | 'overpaid';

  declare status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'void';

  declare requiresApproval: boolean;
  declare approvalStatus: 'pending' | 'approved' | 'rejected' | null;
  declare approvedBy: string | null;
  declare approvedAt: Date | null;
  declare rejectionReason: string | null;

  declare isPosted: boolean;
  declare postedAt: Date | null;
  declare postedBy: string | null;
  declare journalEntryId: string | null;

  declare daysPastDue: number;
  declare isOverdue: boolean;

  declare salesPersonId: string | null;
  declare salesPersonName: string | null;

  declare description: string | null;
  declare notes: string | null;
  declare internalNotes: string | null;
  declare terms: string | null;

  declare sentToCustomerAt: Date | null;
  declare sentToCustomerEmail: string | null;
  declare emailCount: number;
  declare lastEmailedAt: Date | null;

  declare createdBy: string;
  declare updatedBy: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  declare isVoid: boolean;
  declare voidedAt: Date | null;
  declare voidedBy: string | null;
  declare voidReason: string | null;
}

Invoice.init(
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
    invoiceNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: false,
    },
    referenceNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    salesOrderId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'sales_orders',
        key: 'id',
      },
    },
    soNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    customerPONumber: {
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
    customerAddress: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    customerTaxId: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    invoiceDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    deliveryDate: {
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
    subtotal: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: false,
      defaultValue: 0,
    },
    discountPercent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    discountAmount: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: false,
      defaultValue: 0,
    },
    taxAmount: {
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
    balanceAmount: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: false,
      defaultValue: 0,
    },
    paymentStatus: {
      type: DataTypes.ENUM('unpaid', 'partial', 'paid', 'overpaid'),
      allowNull: false,
      defaultValue: 'unpaid',
    },
    status: {
      type: DataTypes.ENUM('draft', 'pending_approval', 'approved', 'sent', 'void'),
      allowNull: false,
      defaultValue: 'draft',
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
    rejectionReason: {
      type: DataTypes.TEXT,
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
    daysPastDue: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    isOverdue: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    salesPersonId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    salesPersonName: {
      type: DataTypes.STRING(255),
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
    terms: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sentToCustomerAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    sentToCustomerEmail: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    emailCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    lastEmailedAt: {
      type: DataTypes.DATE,
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
    tableName: 'invoices',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['companyId', 'invoiceNumber'],
      },
      {
        fields: ['companyId', 'customerId'],
      },
      {
        fields: ['companyId', 'status'],
      },
      {
        fields: ['companyId', 'paymentStatus'],
      },
      {
        fields: ['companyId', 'invoiceDate'],
      },
      {
        fields: ['companyId', 'dueDate'],
      },
      {
        fields: ['companyId', 'isOverdue'],
      },
      {
        fields: ['salesOrderId'],
      },
      {
        fields: ['journalEntryId'],
      },
    ],
  }
);

export default Invoice;
