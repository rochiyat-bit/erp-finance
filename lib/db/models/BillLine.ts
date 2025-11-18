import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../sequelize';

export interface BillLineAttributes {
  id: string;
  companyId: string;
  billId: string;
  lineNumber: number;

  // Item/Service Details
  itemType: 'goods' | 'service' | 'expense';
  itemCode: string | null;
  itemName: string;
  description: string | null;

  // GL Account
  expenseAccountId: string; // Expense/Asset account to debit
  accountCode: string;
  accountName: string;

  // Quantity and Pricing
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
  lineAmount: number; // quantity * unitPrice

  // Tax Information
  taxCode: string | null;
  taxRate: number;
  taxAmount: number;

  // Discount
  discountPercent: number;
  discountAmount: number;

  // Total
  totalAmount: number; // lineAmount - discountAmount + taxAmount

  // Cost Center and Project (Optional Dimensions)
  costCenterId: string | null;
  projectId: string | null;
  departmentId: string | null;

  // Purchase Order Reference
  purchaseOrderLineId: string | null;
  goodsReceiptLineId: string | null;

  // Additional Information
  notes: string | null;

  // Metadata
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BillLineCreationAttributes extends Optional<BillLineAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class BillLine extends Model<BillLineAttributes, BillLineCreationAttributes> implements BillLineAttributes {
  declare id: string;
  declare companyId: string;
  declare billId: string;
  declare lineNumber: number;

  declare itemType: 'goods' | 'service' | 'expense';
  declare itemCode: string | null;
  declare itemName: string;
  declare description: string | null;

  declare expenseAccountId: string;
  declare accountCode: string;
  declare accountName: string;

  declare quantity: number;
  declare unitOfMeasure: string;
  declare unitPrice: number;
  declare lineAmount: number;

  declare taxCode: string | null;
  declare taxRate: number;
  declare taxAmount: number;

  declare discountPercent: number;
  declare discountAmount: number;

  declare totalAmount: number;

  declare costCenterId: string | null;
  declare projectId: string | null;
  declare departmentId: string | null;

  declare purchaseOrderLineId: string | null;
  declare goodsReceiptLineId: string | null;

  declare notes: string | null;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

BillLine.init(
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
    billId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'bills',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    lineNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    itemType: {
      type: DataTypes.ENUM('goods', 'service', 'expense'),
      allowNull: false,
      defaultValue: 'expense',
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
    expenseAccountId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'chart_of_accounts',
        key: 'id',
      },
    },
    accountCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    accountName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: false,
      defaultValue: 1,
    },
    unitOfMeasure: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'EA',
    },
    unitPrice: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: false,
      defaultValue: 0,
    },
    lineAmount: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: false,
      defaultValue: 0,
    },
    taxCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    taxRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    taxAmount: {
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
    totalAmount: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: false,
      defaultValue: 0,
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
    purchaseOrderLineId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    goodsReceiptLineId: {
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
    tableName: 'bill_lines',
    timestamps: true,
    indexes: [
      {
        fields: ['billId', 'lineNumber'],
      },
      {
        fields: ['companyId'],
      },
      {
        fields: ['expenseAccountId'],
      },
    ],
  }
);

export default BillLine;
