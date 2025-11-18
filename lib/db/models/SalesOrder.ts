import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../sequelize';

export interface SalesOrderAttributes {
  id: string;
  companyId: string;

  // SO Number & Reference
  soNumber: string; // Auto-generated: SO-2024-00001
  customerPONumber: string | null;
  referenceNumber: string | null;

  // Customer Info
  customerId: string;
  customerName: string;
  customerAddress: string;

  // Dates
  soDate: Date;
  expectedDeliveryDate: Date | null;
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

  // Status & Workflow
  status: 'draft' | 'pending_approval' | 'approved' | 'confirmed' | 'partial_delivered' | 'delivered' | 'invoiced' | 'closed' | 'cancelled';

  // Approval
  requiresApproval: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected' | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectionReason: string | null;

  // Delivery Tracking
  isFullyDelivered: boolean;
  deliveredAmount: number;

  // Invoice Tracking
  isFullyInvoiced: boolean;
  invoicedAmount: number;

  // Sales Info
  salesPersonId: string | null;
  salesPersonName: string | null;

  // Additional Info
  notes: string | null;
  internalNotes: string | null;
  terms: string | null;

  // Customer confirmation
  confirmedAt: Date | null;
  sentToCustomerAt: Date | null;

  // Metadata
  createdBy: string;
  updatedBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SalesOrderCreationAttributes extends Optional<SalesOrderAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class SalesOrder extends Model<SalesOrderAttributes, SalesOrderCreationAttributes> implements SalesOrderAttributes {
  declare id: string;
  declare companyId: string;

  declare soNumber: string;
  declare customerPONumber: string | null;
  declare referenceNumber: string | null;

  declare customerId: string;
  declare customerName: string;
  declare customerAddress: string;

  declare soDate: Date;
  declare expectedDeliveryDate: Date | null;
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

  declare status: 'draft' | 'pending_approval' | 'approved' | 'confirmed' | 'partial_delivered' | 'delivered' | 'invoiced' | 'closed' | 'cancelled';

  declare requiresApproval: boolean;
  declare approvalStatus: 'pending' | 'approved' | 'rejected' | null;
  declare approvedBy: string | null;
  declare approvedAt: Date | null;
  declare rejectionReason: string | null;

  declare isFullyDelivered: boolean;
  declare deliveredAmount: number;

  declare isFullyInvoiced: boolean;
  declare invoicedAmount: number;

  declare salesPersonId: string | null;
  declare salesPersonName: string | null;

  declare notes: string | null;
  declare internalNotes: string | null;
  declare terms: string | null;

  declare confirmedAt: Date | null;
  declare sentToCustomerAt: Date | null;

  declare createdBy: string;
  declare updatedBy: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

SalesOrder.init(
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
    soNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: false,
    },
    customerPONumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    referenceNumber: {
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
    soDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    expectedDeliveryDate: {
      type: DataTypes.DATE,
      allowNull: true,
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
    status: {
      type: DataTypes.ENUM('draft', 'pending_approval', 'approved', 'confirmed', 'partial_delivered', 'delivered', 'invoiced', 'closed', 'cancelled'),
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
    isFullyDelivered: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    deliveredAmount: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: false,
      defaultValue: 0,
    },
    isFullyInvoiced: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    invoicedAmount: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: false,
      defaultValue: 0,
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
    confirmedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    sentToCustomerAt: {
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
  },
  {
    sequelize,
    tableName: 'sales_orders',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['companyId', 'soNumber'],
      },
      {
        fields: ['companyId', 'customerId'],
      },
      {
        fields: ['companyId', 'status'],
      },
      {
        fields: ['companyId', 'soDate'],
      },
    ],
  }
);

export default SalesOrder;
