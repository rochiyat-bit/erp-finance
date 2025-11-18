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
  sequelize,
};

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
  sequelize,
  initializeDatabase,
};
