import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../sequelize';
import Company from './Company';
import ChartOfAccount from './ChartOfAccount';
import { FiscalYear, FiscalPeriod } from './index';

export interface AccountBalanceAttributes {
  id: string;
  companyId: string;
  accountId: string;
  fiscalYearId: string;
  fiscalPeriodId: string;

  openingBalance: number;
  debitTotal: number;
  creditTotal: number;
  netMovement: number;
  closingBalance: number;

  openingBalanceFC?: number;
  debitTotalFC?: number;
  creditTotalFC?: number;
  closingBalanceFC?: number;
  currencyCode?: string;

  ytdDebit: number;
  ytdCredit: number;
  ytdBalance: number;

  lastUpdated: Date;
  calculatedAt: Date;
}

interface AccountBalanceCreationAttributes extends Optional<AccountBalanceAttributes, 'id' | 'lastUpdated' | 'calculatedAt'> {}

class AccountBalance extends Model<AccountBalanceAttributes, AccountBalanceCreationAttributes> implements AccountBalanceAttributes {
  declare id: string;
  declare companyId: string;
  declare accountId: string;
  declare fiscalYearId: string;
  declare fiscalPeriodId: string;

  declare openingBalance: number;
  declare debitTotal: number;
  declare creditTotal: number;
  declare netMovement: number;
  declare closingBalance: number;

  declare openingBalanceFC?: number;
  declare debitTotalFC?: number;
  declare creditTotalFC?: number;
  declare closingBalanceFC?: number;
  declare currencyCode?: string;

  declare ytdDebit: number;
  declare ytdCredit: number;
  declare ytdBalance: number;

  declare lastUpdated: Date;
  declare calculatedAt: Date;
}

AccountBalance.init(
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
    accountId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'chart_of_accounts',
        key: 'id',
      },
    },
    fiscalYearId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'fiscal_years',
        key: 'id',
      },
    },
    fiscalPeriodId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'fiscal_periods',
        key: 'id',
      },
    },
    openingBalance: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    debitTotal: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    creditTotal: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    netMovement: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    closingBalance: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    openingBalanceFC: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    debitTotalFC: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    creditTotalFC: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    closingBalanceFC: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    currencyCode: {
      type: DataTypes.STRING(3),
      allowNull: true,
    },
    ytdDebit: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    ytdCredit: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    ytdBalance: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    lastUpdated: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    calculatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'account_balances',
    timestamps: false,
    indexes: [
      {
        fields: ['companyId', 'fiscalPeriodId'],
      },
      {
        fields: ['accountId', 'fiscalPeriodId'],
      },
      {
        unique: true,
        fields: ['companyId', 'accountId', 'fiscalPeriodId'],
      },
    ],
  }
);

AccountBalance.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
AccountBalance.belongsTo(ChartOfAccount, { foreignKey: 'accountId', as: 'account' });

export default AccountBalance;
