import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../sequelize';

export interface InvoiceLineAttributes {
  id: string;
  companyId: string;
  invoiceId: string;
  salesOrderLineId: string | null;

  lineNumber: number;

  // Item/Service
  itemCode: string | null;
  itemName: string;
  description: string | null;

  // Quantity & Pricing
  quantity: number;
  unit: string;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  lineTotal: number;

  // GL Account
  revenueAccountId: string;
  revenueAccountCode: string;

  // Dimensions (optional)
  costCenterId: string | null;
  projectId: string | null;
  departmentId: string | null;

  notes: string | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface InvoiceLineCreationAttributes extends Optional<InvoiceLineAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class InvoiceLine extends Model<InvoiceLineAttributes, InvoiceLineCreationAttributes> implements InvoiceLineAttributes {
  declare id: string;
  declare companyId: string;
  declare invoiceId: string;
  declare salesOrderLineId: string | null;

  declare lineNumber: number;

  declare itemCode: string | null;
  declare itemName: string;
  declare description: string | null;

  declare quantity: number;
  declare unit: string;
  declare unitPrice: number;
  declare discountPercent: number;
  declare discountAmount: number;
  declare taxPercent: number;
  declare taxAmount: number;
  declare lineTotal: number;

  declare revenueAccountId: string;
  declare revenueAccountCode: string;

  declare costCenterId: string | null;
  declare projectId: string | null;
  declare departmentId: string | null;

  declare notes: string | null;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

InvoiceLine.init(
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
    invoiceId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'invoices',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    salesOrderLineId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'sales_order_lines',
        key: 'id',
      },
    },
    lineNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    itemCode: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    itemName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    quantity: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: false,
      defaultValue: 1,
    },
    unit: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'EA',
    },
    unitPrice: {
      type: DataTypes.DECIMAL(19, 6),
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
    taxPercent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    taxAmount: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: false,
      defaultValue: 0,
    },
    lineTotal: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: false,
      defaultValue: 0,
    },
    revenueAccountId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'chart_of_accounts',
        key: 'id',
      },
    },
    revenueAccountCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    costCenterId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    departmentId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'invoice_lines',
    timestamps: true,
    indexes: [
      {
        fields: ['invoiceId', 'lineNumber'],
      },
      {
        fields: ['companyId'],
      },
      {
        fields: ['revenueAccountId'],
      },
    ],
  }
);

export default InvoiceLine;
