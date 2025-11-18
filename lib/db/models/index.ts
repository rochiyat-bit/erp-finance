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
  sequelize,
  initializeDatabase,
};
