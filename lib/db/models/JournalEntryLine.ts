import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../sequelize';
import JournalEntry from './JournalEntry';
import ChartOfAccount from './ChartOfAccount';

export interface JournalEntryLineAttributes {
  id: string;
  companyId: string;
  journalEntryId: string;

  lineNumber: number;
  description?: string;

  accountId: string;
  accountCode: string;
  accountName: string;

  debitAmount: number;
  creditAmount: number;
  debitAmountFC?: number;
  creditAmountFC?: number;

  currencyCode: string;
  exchangeRate: number;

  costCenterId?: string;
  projectId?: string;
  departmentId?: string;

  referenceType?: string;
  referenceId?: string;
  referenceNumber?: string;

  createdAt: Date;
  updatedAt: Date;
}

interface JournalEntryLineCreationAttributes extends Optional<JournalEntryLineAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class JournalEntryLine extends Model<JournalEntryLineAttributes, JournalEntryLineCreationAttributes> implements JournalEntryLineAttributes {
  declare id: string;
  declare companyId: string;
  declare journalEntryId: string;

  declare lineNumber: number;
  declare description?: string;

  declare accountId: string;
  declare accountCode: string;
  declare accountName: string;

  declare debitAmount: number;
  declare creditAmount: number;
  declare debitAmountFC?: number;
  declare creditAmountFC?: number;

  declare currencyCode: string;
  declare exchangeRate: number;

  declare costCenterId?: string;
  declare projectId?: string;
  declare departmentId?: string;

  declare referenceType?: string;
  declare referenceId?: string;
  declare referenceNumber?: string;

  declare createdAt: Date;
  declare updatedAt: Date;
}

JournalEntryLine.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    journalEntryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'journal_entries',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    lineNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    debitAmountFC: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    creditAmountFC: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
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
    referenceType: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    referenceId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    referenceNumber: {
      type: DataTypes.STRING(100),
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
  },
  {
    sequelize,
    tableName: 'journal_entry_lines',
    timestamps: true,
    indexes: [
      {
        fields: ['journalEntryId'],
      },
      {
        fields: ['accountId'],
      },
      {
        fields: ['companyId', 'accountId'],
      },
    ],
  }
);

JournalEntryLine.belongsTo(JournalEntry, { foreignKey: 'journalEntryId', as: 'journalEntry' });
JournalEntry.hasMany(JournalEntryLine, { foreignKey: 'journalEntryId', as: 'lines' });

JournalEntryLine.belongsTo(ChartOfAccount, { foreignKey: 'accountId', as: 'account' });
ChartOfAccount.hasMany(JournalEntryLine, { foreignKey: 'accountId', as: 'journalEntryLines' });

export default JournalEntryLine;
