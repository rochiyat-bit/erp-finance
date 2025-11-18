// Import all models
import Company from './Company';
import User from './User';
import Role from './Role';
import Permission from './Permission';
import AuditLog from './AuditLog';
import SystemSetting from './SystemSetting';
import Currency from './Currency';
import ExchangeRate from './ExchangeRate';
import FiscalYear from './FiscalYear';
import FiscalPeriod from './FiscalPeriod';
import ChartOfAccount from './ChartOfAccount';
import JournalEntry from './JournalEntry';
import JournalEntryLine from './JournalEntryLine';
import GeneralLedger from './GeneralLedger';
import AccountBalance from './AccountBalance';
import JournalEntryTemplate from './JournalEntryTemplate';
import Vendor from './Vendor';
import Bill from './Bill';
import BillLine from './BillLine';
import BillPayment from './BillPayment';
import PaymentAllocation from './PaymentAllocation';
import Customer from './Customer';
import SalesOrder from './SalesOrder';
import SalesOrderLine from './SalesOrderLine';
import Invoice from './Invoice';
import InvoiceLine from './InvoiceLine';
import CustomerPayment from './CustomerPayment';
import CustomerPaymentAllocation from './CustomerPaymentAllocation';
import AssetCategory from './AssetCategory';
import AssetLocation from './AssetLocation';
import FixedAsset from './FixedAsset';
import AssetDepreciation from './AssetDepreciation';
import AssetMovement from './AssetMovement';
import AssetMaintenance from './AssetMaintenance';
import AssetRevaluation from './AssetRevaluation';
import AssetDisposal from './AssetDisposal';
import sequelize from '../sequelize';

// Export all models
export {
  Company,
  User,
  Role,
  Permission,
  AuditLog,
  SystemSetting,
  Currency,
  ExchangeRate,
  FiscalYear,
  FiscalPeriod,
  ChartOfAccount,
  JournalEntry,
  JournalEntryLine,
  GeneralLedger,
  AccountBalance,
  JournalEntryTemplate,
  Vendor,
  Bill,
  BillLine,
  BillPayment,
  PaymentAllocation,
  Customer,
  SalesOrder,
  SalesOrderLine,
  Invoice,
  InvoiceLine,
  CustomerPayment,
  CustomerPaymentAllocation,
  AssetCategory,
  AssetLocation,
  FixedAsset,
  AssetDepreciation,
  AssetMovement,
  AssetMaintenance,
  AssetRevaluation,
  AssetDisposal,
  sequelize,
};

// Define model associations
// AP Module Relationships
Vendor.hasMany(Bill, { foreignKey: 'vendorId', as: 'bills' });
Bill.belongsTo(Vendor, { foreignKey: 'vendorId', as: 'vendor' });

Vendor.hasMany(BillPayment, { foreignKey: 'vendorId', as: 'payments' });
BillPayment.belongsTo(Vendor, { foreignKey: 'vendorId', as: 'vendor' });

Bill.hasMany(BillLine, { foreignKey: 'billId', as: 'lines' });
BillLine.belongsTo(Bill, { foreignKey: 'billId', as: 'bill' });

Bill.hasMany(PaymentAllocation, { foreignKey: 'billId', as: 'allocations' });
PaymentAllocation.belongsTo(Bill, { foreignKey: 'billId', as: 'bill' });

BillPayment.hasMany(PaymentAllocation, { foreignKey: 'billPaymentId', as: 'allocations' });
PaymentAllocation.belongsTo(BillPayment, { foreignKey: 'billPaymentId', as: 'payment' });

Bill.belongsTo(JournalEntry, { foreignKey: 'journalEntryId', as: 'journalEntry' });
BillPayment.belongsTo(JournalEntry, { foreignKey: 'journalEntryId', as: 'journalEntry' });

Bill.belongsTo(ChartOfAccount, { foreignKey: 'apAccountId', as: 'apAccount' });
BillLine.belongsTo(ChartOfAccount, { foreignKey: 'expenseAccountId', as: 'expenseAccount' });
BillPayment.belongsTo(ChartOfAccount, { foreignKey: 'bankAccountId', as: 'bankAccount' });
BillPayment.belongsTo(ChartOfAccount, { foreignKey: 'apAccountId', as: 'apAccount' });

Vendor.belongsTo(ChartOfAccount, { foreignKey: 'apAccountId', as: 'apAccount' });
Vendor.belongsTo(ChartOfAccount, { foreignKey: 'expenseAccountId', as: 'expenseAccount' });

// AR Module Relationships
Customer.hasMany(SalesOrder, { foreignKey: 'customerId', as: 'salesOrders' });
SalesOrder.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

Customer.hasMany(Invoice, { foreignKey: 'customerId', as: 'invoices' });
Invoice.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

Customer.hasMany(CustomerPayment, { foreignKey: 'customerId', as: 'payments' });
CustomerPayment.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

SalesOrder.hasMany(SalesOrderLine, { foreignKey: 'salesOrderId', as: 'lines' });
SalesOrderLine.belongsTo(SalesOrder, { foreignKey: 'salesOrderId', as: 'salesOrder' });

SalesOrder.hasMany(Invoice, { foreignKey: 'salesOrderId', as: 'invoices' });
Invoice.belongsTo(SalesOrder, { foreignKey: 'salesOrderId', as: 'salesOrder' });

Invoice.hasMany(InvoiceLine, { foreignKey: 'invoiceId', as: 'lines' });
InvoiceLine.belongsTo(Invoice, { foreignKey: 'invoiceId', as: 'invoice' });

Invoice.hasMany(CustomerPaymentAllocation, { foreignKey: 'invoiceId', as: 'allocations' });
CustomerPaymentAllocation.belongsTo(Invoice, { foreignKey: 'invoiceId', as: 'invoice' });

CustomerPayment.hasMany(CustomerPaymentAllocation, { foreignKey: 'customerPaymentId', as: 'allocations' });
CustomerPaymentAllocation.belongsTo(CustomerPayment, { foreignKey: 'customerPaymentId', as: 'payment' });

Invoice.belongsTo(JournalEntry, { foreignKey: 'journalEntryId', as: 'journalEntry' });
CustomerPayment.belongsTo(JournalEntry, { foreignKey: 'journalEntryId', as: 'journalEntry' });

Customer.belongsTo(ChartOfAccount, { foreignKey: 'defaultARAccountId', as: 'arAccount' });
Customer.belongsTo(ChartOfAccount, { foreignKey: 'defaultRevenueAccountId', as: 'revenueAccount' });
InvoiceLine.belongsTo(ChartOfAccount, { foreignKey: 'revenueAccountId', as: 'revenueAccount' });
CustomerPayment.belongsTo(ChartOfAccount, { foreignKey: 'bankAccountId', as: 'bankAccount' });

// FA Module Relationships
AssetCategory.hasMany(FixedAsset, { foreignKey: 'assetCategoryId', as: 'assets' });
FixedAsset.belongsTo(AssetCategory, { foreignKey: 'assetCategoryId', as: 'category' });

AssetCategory.belongsTo(AssetCategory, { foreignKey: 'parentCategoryId', as: 'parentCategory' });
AssetCategory.hasMany(AssetCategory, { foreignKey: 'parentCategoryId', as: 'subcategories' });

AssetLocation.hasMany(FixedAsset, { foreignKey: 'locationId', as: 'assets' });
FixedAsset.belongsTo(AssetLocation, { foreignKey: 'locationId', as: 'location' });

AssetLocation.belongsTo(AssetLocation, { foreignKey: 'parentLocationId', as: 'parentLocation' });
AssetLocation.hasMany(AssetLocation, { foreignKey: 'parentLocationId', as: 'sublocations' });

FixedAsset.hasMany(AssetDepreciation, { foreignKey: 'assetId', as: 'depreciations' });
AssetDepreciation.belongsTo(FixedAsset, { foreignKey: 'assetId', as: 'asset' });

FixedAsset.hasMany(AssetMovement, { foreignKey: 'assetId', as: 'movements' });
AssetMovement.belongsTo(FixedAsset, { foreignKey: 'assetId', as: 'asset' });

FixedAsset.hasMany(AssetMaintenance, { foreignKey: 'assetId', as: 'maintenances' });
AssetMaintenance.belongsTo(FixedAsset, { foreignKey: 'assetId', as: 'asset' });

FixedAsset.hasMany(AssetRevaluation, { foreignKey: 'assetId', as: 'revaluations' });
AssetRevaluation.belongsTo(FixedAsset, { foreignKey: 'assetId', as: 'asset' });

FixedAsset.hasMany(AssetDisposal, { foreignKey: 'assetId', as: 'disposals' });
AssetDisposal.belongsTo(FixedAsset, { foreignKey: 'assetId', as: 'asset' });

// FA to GL relationships
AssetCategory.belongsTo(ChartOfAccount, { foreignKey: 'assetAccountId', as: 'assetAccount' });
AssetCategory.belongsTo(ChartOfAccount, { foreignKey: 'accumulatedDepreciationAccountId', as: 'accumulatedDepreciationAccount' });
AssetCategory.belongsTo(ChartOfAccount, { foreignKey: 'depreciationExpenseAccountId', as: 'depreciationExpenseAccount' });
AssetCategory.belongsTo(ChartOfAccount, { foreignKey: 'disposalGainAccountId', as: 'disposalGainAccount' });
AssetCategory.belongsTo(ChartOfAccount, { foreignKey: 'disposalLossAccountId', as: 'disposalLossAccount' });

FixedAsset.belongsTo(ChartOfAccount, { foreignKey: 'assetAccountId', as: 'assetAccount' });
FixedAsset.belongsTo(ChartOfAccount, { foreignKey: 'accumulatedDepreciationAccountId', as: 'accumulatedDepreciationAccount' });
FixedAsset.belongsTo(ChartOfAccount, { foreignKey: 'depreciationExpenseAccountId', as: 'depreciationExpenseAccount' });

AssetDepreciation.belongsTo(JournalEntry, { foreignKey: 'journalEntryId', as: 'journalEntry' });
AssetDepreciation.belongsTo(JournalEntry, { foreignKey: 'reversalJournalEntryId', as: 'reversalJournalEntry' });

AssetRevaluation.belongsTo(JournalEntry, { foreignKey: 'journalEntryId', as: 'journalEntry' });
AssetDisposal.belongsTo(JournalEntry, { foreignKey: 'journalEntryId', as: 'journalEntry' });

// FA to AP/AR relationships
FixedAsset.belongsTo(Vendor, { foreignKey: 'vendorId', as: 'vendor' });
FixedAsset.belongsTo(Bill, { foreignKey: 'billId', as: 'bill' });
FixedAsset.belongsTo(Customer, { foreignKey: 'buyerId', as: 'buyer' });
FixedAsset.belongsTo(Invoice, { foreignKey: 'invoiceId', as: 'invoice' });

AssetMaintenance.belongsTo(Vendor, { foreignKey: 'vendorId', as: 'vendor' });
AssetMaintenance.belongsTo(Bill, { foreignKey: 'billId', as: 'bill' });

AssetDisposal.belongsTo(Customer, { foreignKey: 'buyerId', as: 'buyer' });
AssetDisposal.belongsTo(Invoice, { foreignKey: 'invoiceId', as: 'invoice' });

// FA to Fiscal Period relationships
AssetDepreciation.belongsTo(FiscalPeriod, { foreignKey: 'fiscalPeriodId', as: 'fiscalPeriod' });
AssetDepreciation.belongsTo(FiscalYear, { foreignKey: 'fiscalYearId', as: 'fiscalYear' });

// Initialize all models and associations
export async function initializeDatabase() {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✓ Database connection established successfully.');

    // Sync models (create tables if they don't exist)
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('✓ Database models synchronized successfully.');

    return true;
  } catch (error) {
    console.error('✗ Database initialization failed:', error);
    return false;
  }
}

export default {
  Company,
  User,
  Role,
  Permission,
  AuditLog,
  SystemSetting,
  Currency,
  ExchangeRate,
  FiscalYear,
  FiscalPeriod,
  ChartOfAccount,
  JournalEntry,
  JournalEntryLine,
  GeneralLedger,
  AccountBalance,
  JournalEntryTemplate,
  Vendor,
  Bill,
  BillLine,
  BillPayment,
  PaymentAllocation,
  Customer,
  SalesOrder,
  SalesOrderLine,
  Invoice,
  InvoiceLine,
  CustomerPayment,
  CustomerPaymentAllocation,
  AssetCategory,
  AssetLocation,
  FixedAsset,
  AssetDepreciation,
  AssetMovement,
  AssetMaintenance,
  AssetRevaluation,
  AssetDisposal,
  sequelize,
  initializeDatabase,
};
