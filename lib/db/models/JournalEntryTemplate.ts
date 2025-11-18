import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../sequelize';
import Company from './Company';

export interface JournalEntryTemplateAttributes {
  id: string;
  companyId: string;

  code: string;
  name: string;
  description?: string;
  category: string;

  lines: Array<{
    lineNumber: number;
    accountId: string;
    accountCode: string;
    description: string;
    debitFormula?: string;
    creditFormula?: string;
    isVariable: boolean;
  }>;

  defaultDescription: string;
  requiresApproval: boolean;
  isActive: boolean;

  usageCount: number;
  lastUsedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

interface JournalEntryTemplateCreationAttributes extends Optional<JournalEntryTemplateAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class JournalEntryTemplate extends Model<JournalEntryTemplateAttributes, JournalEntryTemplateCreationAttributes> implements JournalEntryTemplateAttributes {
  declare id: string;
  declare companyId: string;

  declare code: string;
  declare name: string;
  declare description?: string;
  declare category: string;

  declare lines: Array<{
    lineNumber: number;
    accountId: string;
    accountCode: string;
    description: string;
    debitFormula?: string;
    creditFormula?: string;
    isVariable: boolean;
  }>;

  declare defaultDescription: string;
  declare requiresApproval: boolean;
  declare isActive: boolean;

  declare usageCount: number;
  declare lastUsedAt?: Date;

  declare createdAt: Date;
  declare updatedAt: Date;
  declare createdBy: string;
  declare updatedBy: string;
}

JournalEntryTemplate.init(
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
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    lines: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    defaultDescription: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    requiresApproval: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    usageCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    lastUsedAt: {
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
    tableName: 'journal_entry_templates',
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
        fields: ['category'],
      },
    ],
  }
);

JournalEntryTemplate.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Company.hasMany(JournalEntryTemplate, { foreignKey: 'companyId', as: 'journalEntryTemplates' });

export default JournalEntryTemplate;
