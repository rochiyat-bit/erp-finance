import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../sequelize';

export interface CustomerAttributes {
  id: string;
  companyId: string;

  // Customer Code & Info
  customerCode: string; // Auto-generated: CUST-2024-00001
  customerName: string;
  legalName: string;
  displayName: string;

  // Business Details
  taxId: string | null;
  registrationNumber: string | null;
  businessType: 'individual' | 'company' | 'government';
  industryType: string | null;

  // Contact Information
  email: string;
  phone: string;
  fax: string | null;
  website: string | null;

  // Primary Contact Person
  contactPersonName: string | null;
  contactPersonEmail: string | null;
  contactPersonPhone: string | null;
  contactPersonPosition: string | null;

  // Billing Address
  billingAddressLine1: string;
  billingAddressLine2: string | null;
  billingCity: string;
  billingState: string;
  billingCountry: string;
  billingPostalCode: string;

  // Shipping Address
  shippingAddressLine1: string | null;
  shippingAddressLine2: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingCountry: string | null;
  shippingPostalCode: string | null;
  sameAsBillingAddress: boolean;

  // Financial Settings
  currencyCode: string;
  paymentTerms: string;
  paymentTermDays: number;
  creditLimit: number;
  currentBalance: number;

  // GL Account Mappings
  defaultARAccountId: string;
  defaultRevenueAccountId: string | null;

  // Banking Information
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  bankBranch: string | null;

  // Tax Settings
  isTaxable: boolean;
  taxRegistrationNumber: string | null;
  defaultTaxRate: number;
  taxExemptReason: string | null;

  // Customer Classification
  customerType: 'retail' | 'wholesale' | 'corporate';
  customerCategory: string | null;
  customerGroup: string | null;
  salesPersonId: string | null;

  // Status & Rating
  status: 'active' | 'inactive' | 'suspended' | 'blocked';
  rating: number;
  notes: string | null;
  internalNotes: string | null;

  // Performance Metrics
  totalSales: number;
  totalCollected: number;
  averageCollectionDays: number;
  lastSaleDate: Date | null;
  lastPaymentDate: Date | null;

  // Settings
  isKeyAccount: boolean;
  allowCreditSales: boolean;
  autoEmailInvoices: boolean;
  autoEmailStatements: boolean;

  // Pricing
  discountPercent: number;

  // Metadata
  createdBy: string;
  updatedBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CustomerCreationAttributes extends Optional<CustomerAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Customer extends Model<CustomerAttributes, CustomerCreationAttributes> implements CustomerAttributes {
  declare id: string;
  declare companyId: string;

  declare customerCode: string;
  declare customerName: string;
  declare legalName: string;
  declare displayName: string;

  declare taxId: string | null;
  declare registrationNumber: string | null;
  declare businessType: 'individual' | 'company' | 'government';
  declare industryType: string | null;

  declare email: string;
  declare phone: string;
  declare fax: string | null;
  declare website: string | null;

  declare contactPersonName: string | null;
  declare contactPersonEmail: string | null;
  declare contactPersonPhone: string | null;
  declare contactPersonPosition: string | null;

  declare billingAddressLine1: string;
  declare billingAddressLine2: string | null;
  declare billingCity: string;
  declare billingState: string;
  declare billingCountry: string;
  declare billingPostalCode: string;

  declare shippingAddressLine1: string | null;
  declare shippingAddressLine2: string | null;
  declare shippingCity: string | null;
  declare shippingState: string | null;
  declare shippingCountry: string | null;
  declare shippingPostalCode: string | null;
  declare sameAsBillingAddress: boolean;

  declare currencyCode: string;
  declare paymentTerms: string;
  declare paymentTermDays: number;
  declare creditLimit: number;
  declare currentBalance: number;

  declare defaultARAccountId: string;
  declare defaultRevenueAccountId: string | null;

  declare bankName: string | null;
  declare bankAccountNumber: string | null;
  declare bankAccountName: string | null;
  declare bankBranch: string | null;

  declare isTaxable: boolean;
  declare taxRegistrationNumber: string | null;
  declare defaultTaxRate: number;
  declare taxExemptReason: string | null;

  declare customerType: 'retail' | 'wholesale' | 'corporate';
  declare customerCategory: string | null;
  declare customerGroup: string | null;
  declare salesPersonId: string | null;

  declare status: 'active' | 'inactive' | 'suspended' | 'blocked';
  declare rating: number;
  declare notes: string | null;
  declare internalNotes: string | null;

  declare totalSales: number;
  declare totalCollected: number;
  declare averageCollectionDays: number;
  declare lastSaleDate: Date | null;
  declare lastPaymentDate: Date | null;

  declare isKeyAccount: boolean;
  declare allowCreditSales: boolean;
  declare autoEmailInvoices: boolean;
  declare autoEmailStatements: boolean;

  declare discountPercent: number;

  declare createdBy: string;
  declare updatedBy: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Customer.init(
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
    customerCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: false,
    },
    customerName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    legalName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    displayName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    taxId: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    registrationNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    businessType: {
      type: DataTypes.ENUM('individual', 'company', 'government'),
      allowNull: false,
      defaultValue: 'company',
    },
    industryType: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    fax: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    contactPersonName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    contactPersonEmail: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    contactPersonPhone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    contactPersonPosition: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    billingAddressLine1: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    billingAddressLine2: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    billingCity: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    billingState: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    billingCountry: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    billingPostalCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    shippingAddressLine1: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    shippingAddressLine2: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    shippingCity: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    shippingState: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    shippingCountry: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    shippingPostalCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    sameAsBillingAddress: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    currencyCode: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
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
    creditLimit: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: false,
      defaultValue: 0,
    },
    currentBalance: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: false,
      defaultValue: 0,
    },
    defaultARAccountId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'chart_of_accounts',
        key: 'id',
      },
    },
    defaultRevenueAccountId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'chart_of_accounts',
        key: 'id',
      },
    },
    bankName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    bankAccountNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    bankAccountName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    bankBranch: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    isTaxable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    taxRegistrationNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    defaultTaxRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    taxExemptReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    customerType: {
      type: DataTypes.ENUM('retail', 'wholesale', 'corporate'),
      allowNull: false,
      defaultValue: 'retail',
    },
    customerCategory: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    customerGroup: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    salesPersonId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended', 'blocked'),
      allowNull: false,
      defaultValue: 'active',
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    internalNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    totalSales: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: false,
      defaultValue: 0,
    },
    totalCollected: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: false,
      defaultValue: 0,
    },
    averageCollectionDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    lastSaleDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastPaymentDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isKeyAccount: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    allowCreditSales: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    autoEmailInvoices: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    autoEmailStatements: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    discountPercent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
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
    tableName: 'customers',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['companyId', 'customerCode'],
      },
      {
        fields: ['companyId', 'customerName'],
      },
      {
        fields: ['companyId', 'status'],
      },
      {
        fields: ['email'],
      },
    ],
  }
);

export default Customer;
