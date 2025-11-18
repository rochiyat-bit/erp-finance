import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../sequelize';

export interface CustomerPaymentAllocationAttributes {
  id: string;
  companyId: string;
  customerPaymentId: string;
  invoiceId: string;

  // Allocation
  allocatedAmount: number;
  discountGiven: number;

  // Invoice info at time of payment
  invoiceNumber: string;
  invoiceTotalAmount: number;
  invoiceBalanceBefore: number;
  invoiceBalanceAfter: number;

  createdAt?: Date;
}

export interface CustomerPaymentAllocationCreationAttributes extends Optional<CustomerPaymentAllocationAttributes, 'id' | 'createdAt'> {}

class CustomerPaymentAllocation extends Model<CustomerPaymentAllocationAttributes, CustomerPaymentAllocationCreationAttributes> implements CustomerPaymentAllocationAttributes {
  declare id: string;
  declare companyId: string;
  declare customerPaymentId: string;
  declare invoiceId: string;

  declare allocatedAmount: number;
  declare discountGiven: number;

  declare invoiceNumber: string;
  declare invoiceTotalAmount: number;
  declare invoiceBalanceBefore: number;
  declare invoiceBalanceAfter: number;

  declare readonly createdAt: Date;
}

CustomerPaymentAllocation.init(
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
    customerPaymentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'customer_payments',
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
    allocatedAmount: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: false,
      defaultValue: 0,
    },
    discountGiven: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: false,
      defaultValue: 0,
    },
    invoiceNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    invoiceTotalAmount: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: false,
    },
    invoiceBalanceBefore: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: false,
    },
    invoiceBalanceAfter: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'customer_payment_allocations',
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        fields: ['companyId'],
      },
      {
        fields: ['customerPaymentId'],
      },
      {
        fields: ['invoiceId'],
      },
    ],
  }
);

export default CustomerPaymentAllocation;
