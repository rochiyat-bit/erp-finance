import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../sequelize';
import Company from './Company';

export interface ChartOfAccountAttributes {
  id: string;
  companyId: string;
  code: string;
  name: string;
  description?: string;

  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  accountSubType: string;
  category: string;

  normalBalance: 'debit' | 'credit';
  isControlAccount: boolean;
  isSystemAccount: boolean;
  isActive: boolean;
  isHeader: boolean;

  parentAccountId?: string;
  level: number;
  sortOrder: number;

  currencyCode?: string;
  allowMultiCurrency: boolean;

  currentBalance: number;
  currentBalanceFC?: number;

  allowManualEntry: boolean;
  requiresCostCenter: boolean;
  requiresProject: boolean;

  openingBalance: number;
  openingBalanceFC?: number;
  openingBalanceDate?: Date;

  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

interface ChartOfAccountCreationAttributes extends Optional<ChartOfAccountAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class ChartOfAccount extends Model<ChartOfAccountAttributes, ChartOfAccountCreationAttributes> implements ChartOfAccountAttributes {
  declare id: string;
  declare companyId: string;
  declare code: string;
  declare name: string;
  declare description?: string;

  declare accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  declare accountSubType: string;
  declare category: string;

  declare normalBalance: 'debit' | 'credit';
  declare isControlAccount: boolean;
  declare isSystemAccount: boolean;
  declare isActive: boolean;
  declare isHeader: boolean;

  declare parentAccountId?: string;
  declare level: number;
  declare sortOrder: number;

  declare currencyCode?: string;
  declare allowMultiCurrency: boolean;

  declare currentBalance: number;
  declare currentBalanceFC?: number;

  declare allowManualEntry: boolean;
  declare requiresCostCenter: boolean;
  declare requiresProject: boolean;

  declare openingBalance: number;
  declare openingBalanceFC?: number;
  declare openingBalanceDate?: Date;

  declare createdAt: Date;
  declare updatedAt: Date;
  declare createdBy: string;
  declare updatedBy: string;
}

ChartOfAccount.init(
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
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    accountType: {
      type: DataTypes.ENUM('asset', 'liability', 'equity', 'revenue', 'expense'),
      allowNull: false,
    },
    accountSubType: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    normalBalance: {
      type: DataTypes.ENUM('debit', 'credit'),
      allowNull: false,
    },
    isControlAccount: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isSystemAccount: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    isHeader: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    parentAccountId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'chart_of_accounts',
        key: 'id',
      },
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    currencyCode: {
      type: DataTypes.STRING(3),
      allowNull: true,
    },
    allowMultiCurrency: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    currentBalance: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    currentBalanceFC: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    allowManualEntry: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    requiresCostCenter: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    requiresProject: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    openingBalance: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    openingBalanceFC: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    openingBalanceDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'chart_of_accounts',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['companyId', 'code'],
      },
      {
        fields: ['companyId', 'isActive'],
      },
      {
        fields: ['companyId', 'accountType'],
      },
      {
        fields: ['parentAccountId'],
      },
    ],
  }
);

ChartOfAccount.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Company.hasMany(ChartOfAccount, { foreignKey: 'companyId', as: 'accounts' });

ChartOfAccount.belongsTo(ChartOfAccount, { foreignKey: 'parentAccountId', as: 'parentAccount' });
ChartOfAccount.hasMany(ChartOfAccount, { foreignKey: 'parentAccountId', as: 'childAccounts' });

export default ChartOfAccount;
