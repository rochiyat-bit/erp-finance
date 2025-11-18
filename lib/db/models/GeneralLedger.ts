import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../sequelize';
import Company from './Company';
import ChartOfAccount from './ChartOfAccount';
import JournalEntry from './JournalEntry';
import { FiscalPeriod } from './index';

export interface GeneralLedgerAttributes {
  id: string;
  companyId: string;

  journalEntryId: string;
  journalEntryLineId: string;

  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;

  transactionDate: Date;
  postingDate: Date;
  description: string;

  debitAmount: number;
  creditAmount: number;
  balanceAmount: number;

  currencyCode: string;
  exchangeRate: number;
  debitAmountFC?: number;
  creditAmountFC?: number;
  balanceAmountFC?: number;

  fiscalYearId: string;
  fiscalPeriodId: string;

  referenceNumber?: string;
  sourceModule?: string;
  sourceDocumentType?: string;
  sourceDocumentId?: string;

  isReversed: boolean;
  reversalGLId?: string;

  createdAt: Date;
  postedBy: string;
}

interface GeneralLedgerCreationAttributes extends Optional<GeneralLedgerAttributes, 'id' | 'createdAt'> {}

class GeneralLedger extends Model<GeneralLedgerAttributes, GeneralLedgerCreationAttributes> implements GeneralLedgerAttributes {
  declare id: string;
  declare companyId: string;

  declare journalEntryId: string;
  declare journalEntryLineId: string;

  declare accountId: string;
  declare accountCode: string;
  declare accountName: string;
  declare accountType: string;

  declare transactionDate: Date;
  declare postingDate: Date;
  declare description: string;

  declare debitAmount: number;
  declare creditAmount: number;
  declare balanceAmount: number;

  declare currencyCode: string;
  declare exchangeRate: number;
  declare debitAmountFC?: number;
  declare creditAmountFC?: number;
  declare balanceAmountFC?: number;

  declare fiscalYearId: string;
  declare fiscalPeriodId: string;

  declare referenceNumber?: string;
  declare sourceModule?: string;
  declare sourceDocumentType?: string;
  declare sourceDocumentId?: string;

  declare isReversed: boolean;
  declare reversalGLId?: string;

  declare createdAt: Date;
  declare postedBy: string;
}

GeneralLedger.init(
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
    journalEntryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'journal_entries',
        key: 'id',
      },
    },
    journalEntryLineId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    accountId: {
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
    accountType: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    transactionDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    postingDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    debitAmount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    creditAmount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    balanceAmount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    currencyCode: {
      type: DataTypes.STRING(3),
      allowNull: false,
    },
    exchangeRate: {
      type: DataTypes.DECIMAL(18, 6),
      allowNull: false,
      defaultValue: 1,
    },
    debitAmountFC: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    creditAmountFC: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    balanceAmountFC: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    fiscalYearId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    fiscalPeriodId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'fiscal_periods',
        key: 'id',
      },
    },
    referenceNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    sourceModule: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    sourceDocumentType: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    sourceDocumentId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    isReversed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    reversalGLId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    postedBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'general_ledgers',
    timestamps: false,
    indexes: [
      {
        fields: ['companyId', 'accountId', 'postingDate'],
      },
      {
        fields: ['companyId', 'fiscalPeriodId'],
      },
      {
        fields: ['accountId', 'postingDate'],
      },
      {
        fields: ['journalEntryId'],
      },
    ],
  }
);

GeneralLedger.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
GeneralLedger.belongsTo(ChartOfAccount, { foreignKey: 'accountId', as: 'account' });
GeneralLedger.belongsTo(JournalEntry, { foreignKey: 'journalEntryId', as: 'journalEntry' });

export default GeneralLedger;
