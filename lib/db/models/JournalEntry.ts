import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../sequelize';
import Company from './Company';
import { FiscalYear, FiscalPeriod } from './index';

export interface JournalEntryAttributes {
  id: string;
  companyId: string;

  journalNumber: string;
  referenceNumber?: string;
  documentType: 'manual' | 'system' | 'recurring' | 'reversing' | 'closing';

  transactionDate: Date;
  postingDate: Date;
  description: string;
  notes?: string;

  fiscalYearId: string;
  fiscalPeriodId: string;

  currencyCode: string;
  exchangeRate: number;

  status: 'draft' | 'pending_approval' | 'approved' | 'posted' | 'rejected' | 'reversed';
  isPosted: boolean;
  postedAt?: Date;
  postedBy?: string;

  requiresApproval: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;

  isReversed: boolean;
  reversedAt?: Date;
  reversedBy?: string;
  reversalJournalId?: string;
  originalJournalId?: string;

  isRecurring: boolean;
  recurringTemplateId?: string;

  totalDebit: number;
  totalCredit: number;
  totalDebitFC?: number;
  totalCreditFC?: number;

  sourceModule?: string;
  sourceDocumentType?: string;
  sourceDocumentId?: string;

  attachments?: string[];

  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

interface JournalEntryCreationAttributes extends Optional<JournalEntryAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class JournalEntry extends Model<JournalEntryAttributes, JournalEntryCreationAttributes> implements JournalEntryAttributes {
  declare id: string;
  declare companyId: string;

  declare journalNumber: string;
  declare referenceNumber?: string;
  declare documentType: 'manual' | 'system' | 'recurring' | 'reversing' | 'closing';

  declare transactionDate: Date;
  declare postingDate: Date;
  declare description: string;
  declare notes?: string;

  declare fiscalYearId: string;
  declare fiscalPeriodId: string;

  declare currencyCode: string;
  declare exchangeRate: number;

  declare status: 'draft' | 'pending_approval' | 'approved' | 'posted' | 'rejected' | 'reversed';
  declare isPosted: boolean;
  declare postedAt?: Date;
  declare postedBy?: string;

  declare requiresApproval: boolean;
  declare approvalStatus?: 'pending' | 'approved' | 'rejected';
  declare approvedBy?: string;
  declare approvedAt?: Date;
  declare rejectionReason?: string;

  declare isReversed: boolean;
  declare reversedAt?: Date;
  declare reversedBy?: string;
  declare reversalJournalId?: string;
  declare originalJournalId?: string;

  declare isRecurring: boolean;
  declare recurringTemplateId?: string;

  declare totalDebit: number;
  declare totalCredit: number;
  declare totalDebitFC?: number;
  declare totalCreditFC?: number;

  declare sourceModule?: string;
  declare sourceDocumentType?: string;
  declare sourceDocumentId?: string;

  declare attachments?: string[];

  declare createdAt: Date;
  declare updatedAt: Date;
  declare createdBy: string;
  declare updatedBy: string;
}

JournalEntry.init(
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
    journalNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    referenceNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    documentType: {
      type: DataTypes.ENUM('manual', 'system', 'recurring', 'reversing', 'closing'),
      allowNull: false,
      defaultValue: 'manual',
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
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    currencyCode: {
      type: DataTypes.STRING(3),
      allowNull: false,
    },
    exchangeRate: {
      type: DataTypes.DECIMAL(18, 6),
      allowNull: false,
      defaultValue: 1,
    },
    status: {
      type: DataTypes.ENUM('draft', 'pending_approval', 'approved', 'posted', 'rejected', 'reversed'),
      allowNull: false,
      defaultValue: 'draft',
    },
    isPosted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    postedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    postedBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    requiresApproval: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    approvalStatus: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: true,
    },
    approvedBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isReversed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    reversedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reversedBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    reversalJournalId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    originalJournalId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    isRecurring: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    recurringTemplateId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    totalDebit: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    totalCredit: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    totalDebitFC: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    totalCreditFC: {
      type: DataTypes.DECIMAL(18, 2),
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
    attachments: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
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
    tableName: 'journal_entries',
    timestamps: true,
    indexes: [
      {
        fields: ['companyId', 'status'],
      },
      {
        fields: ['companyId', 'transactionDate'],
      },
      {
        fields: ['companyId', 'fiscalPeriodId'],
      },
      {
        unique: true,
        fields: ['companyId', 'journalNumber'],
      },
      {
        fields: ['companyId', 'isPosted', 'postingDate'],
      },
      {
        fields: ['sourceModule', 'sourceDocumentId'],
      },
    ],
  }
);

JournalEntry.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Company.hasMany(JournalEntry, { foreignKey: 'companyId', as: 'journalEntries' });

export default JournalEntry;
