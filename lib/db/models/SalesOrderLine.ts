import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../sequelize';

export interface SalesOrderLineAttributes {
  id: string;
  companyId: string;
  salesOrderId: string;

  lineNumber: number;

  // Item/Description
  itemCode: string | null;
  itemName: string;
  description: string | null;

  // Quantity
  quantity: number;
  unit: string;

  // Pricing
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  lineTotal: number;

  // GL Account
  revenueAccountId: string | null;

  // Delivery Tracking
  quantityDelivered: number;
  quantityInvoiced: number;
  quantityRemaining: number;

  // Status
  lineStatus: 'open' | 'partial_delivered' | 'delivered' | 'cancelled';

  // Dates
  requestedDeliveryDate: Date | null;

  notes: string | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface SalesOrderLineCreationAttributes extends Optional<SalesOrderLineAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class SalesOrderLine extends Model<SalesOrderLineAttributes, SalesOrderLineCreationAttributes> implements SalesOrderLineAttributes {
  declare id: string;
  declare companyId: string;
  declare salesOrderId: string;

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

  declare revenueAccountId: string | null;

  declare quantityDelivered: number;
  declare quantityInvoiced: number;
  declare quantityRemaining: number;

  declare lineStatus: 'open' | 'partial_delivered' | 'delivered' | 'cancelled';

  declare requestedDeliveryDate: Date | null;

  declare notes: string | null;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

SalesOrderLine.init(
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
    salesOrderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'sales_orders',
        key: 'id',
      },
      onDelete: 'CASCADE',
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
      allowNull: true,
      references: {
        model: 'chart_of_accounts',
        key: 'id',
      },
    },
    quantityDelivered: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: false,
      defaultValue: 0,
    },
    quantityInvoiced: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: false,
      defaultValue: 0,
    },
    quantityRemaining: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: false,
      defaultValue: 0,
    },
    lineStatus: {
      type: DataTypes.ENUM('open', 'partial_delivered', 'delivered', 'cancelled'),
      allowNull: false,
      defaultValue: 'open',
    },
    requestedDeliveryDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'sales_order_lines',
    timestamps: true,
    indexes: [
      {
        fields: ['salesOrderId', 'lineNumber'],
      },
      {
        fields: ['companyId'],
      },
    ],
  }
);

export default SalesOrderLine;
