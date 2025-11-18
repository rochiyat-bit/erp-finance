import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../sequelize';
import { AuditLog as IAuditLog } from '@/types/models';
import Company from './Company';
import User from './User';

interface AuditLogCreationAttributes extends Optional<IAuditLog, 'id' | 'createdAt'> {}

class AuditLog extends Model<IAuditLog, AuditLogCreationAttributes> implements IAuditLog {
  declare id: string;
  declare companyId: string;
  declare userId: string;
  declare action: string;
  declare module: string;
  declare entityType?: string;
  declare entityId?: string;
  declare oldValues?: object;
  declare newValues?: object;
  declare metadata?: object;
  declare ipAddress: string;
  declare userAgent: string;
  declare status: 'success' | 'failed';
  declare errorMessage?: string;
  declare createdAt: Date;
}

AuditLog.init(
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
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    module: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    entityType: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    entityId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    oldValues: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    newValues: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('success', 'failed'),
      allowNull: false,
      defaultValue: 'success',
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'audit_logs',
    timestamps: false,
    indexes: [
      {
        fields: ['companyId', 'createdAt'],
      },
      {
        fields: ['userId', 'createdAt'],
      },
      {
        fields: ['module'],
      },
      {
        fields: ['action'],
      },
    ],
  }
);

AuditLog.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default AuditLog;
