import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../sequelize';

export interface VendorAttributes {
  id: string;
  companyId: string;
  vendorNumber: string;
  vendorName: string;
  vendorType: 'individual' | 'company' | 'government';
  taxId: string | null;
  registrationNumber: string | null;

  // Contact Information
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  website: string | null;

  // Address
  billingAddress: string | null;
  billingCity: string | null;
  billingState: string | null;
  billingPostalCode: string | null;
  billingCountry: string | null;

  shippingAddress: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingPostalCode: string | null;
  shippingCountry: string | null;

  // Financial Settings
  currencyCode: string;
  paymentTerms: string; // e.g., "Net 30", "Net 60", "2/10 Net 30"
  paymentTermDays: number;
  earlyPaymentDiscount: number;
  creditLimit: number;

  // Account Settings
  apAccountId: string | null; // Accounts Payable control account
  expenseAccountId: string | null; // Default expense account

  // Banking Information
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  bankSwiftCode: string | null;
  bankIban: string | null;

  // Status and Flags
  status: 'active' | 'inactive' | 'blocked';
  isBlocked: boolean;
  blockReason: string | null;

  // Balance Tracking
  currentBalance: number; // Outstanding payable balance
  ytdPurchases: number; // Year-to-date purchases

  // Tax and Compliance
  isTaxExempt: boolean;
  taxExemptNumber: string | null;
  taxCategory: string | null;

  // Additional Information
  notes: string | null;
  internalNotes: string | null;
  tags: string[];

  // Metadata
  createdBy: string;
  updatedBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface VendorCreationAttributes extends Optional<VendorAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Vendor extends Model<VendorAttributes, VendorCreationAttributes> implements VendorAttributes {
  declare id: string;
  declare companyId: string;
  declare vendorNumber: string;
  declare vendorName: string;
  declare vendorType: 'individual' | 'company' | 'government';
  declare taxId: string | null;
  declare registrationNumber: string | null;

  declare contactPerson: string | null;
  declare email: string | null;
  declare phone: string | null;
  declare mobile: string | null;
  declare website: string | null;

  declare billingAddress: string | null;
  declare billingCity: string | null;
  declare billingState: string | null;
  declare billingPostalCode: string | null;
  declare billingCountry: string | null;

  declare shippingAddress: string | null;
  declare shippingCity: string | null;
  declare shippingState: string | null;
  declare shippingPostalCode: string | null;
  declare shippingCountry: string | null;

  declare currencyCode: string;
  declare paymentTerms: string;
  declare paymentTermDays: number;
  declare earlyPaymentDiscount: number;
  declare creditLimit: number;

  declare apAccountId: string | null;
  declare expenseAccountId: string | null;

  declare bankName: string | null;
  declare bankAccountNumber: string | null;
  declare bankAccountName: string | null;
  declare bankSwiftCode: string | null;
  declare bankIban: string | null;

  declare status: 'active' | 'inactive' | 'blocked';
  declare isBlocked: boolean;
  declare blockReason: string | null;

  declare currentBalance: number;
  declare ytdPurchases: number;

  declare isTaxExempt: boolean;
  declare taxExemptNumber: string | null;
  declare taxCategory: string | null;

  declare notes: string | null;
  declare internalNotes: string | null;
  declare tags: string[];

  declare createdBy: string;
  declare updatedBy: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Vendor.init(
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
    vendorNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: false, // Unique per company, handled by index
    },
    vendorName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    vendorType: {
      type: DataTypes.ENUM('individual', 'company', 'government'),
      allowNull: false,
      defaultValue: 'company',
    },
    taxId: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    registrationNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    contactPerson: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    mobile: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    billingAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    billingCity: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    billingState: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    billingPostalCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    billingCountry: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    shippingAddress: {
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
    shippingPostalCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    shippingCountry: {
      type: DataTypes.STRING(100),
      allowNull: true,
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
    earlyPaymentDiscount: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    creditLimit: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: false,
      defaultValue: 0,
    },
    apAccountId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'chart_of_accounts',
        key: 'id',
      },
    },
    expenseAccountId: {
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
    bankSwiftCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    bankIban: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'blocked'),
      allowNull: false,
      defaultValue: 'active',
    },
    isBlocked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    blockReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    currentBalance: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: false,
      defaultValue: 0,
    },
    ytdPurchases: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: false,
      defaultValue: 0,
    },
    isTaxExempt: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    taxExemptNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    taxCategory: {
      type: DataTypes.STRING(100),
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
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
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
    tableName: 'vendors',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['companyId', 'vendorNumber'],
      },
      {
        fields: ['companyId', 'vendorName'],
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

export default Vendor;
