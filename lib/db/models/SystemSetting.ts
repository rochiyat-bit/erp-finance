import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../sequelize';
import { SystemSetting as ISystemSetting } from '@/types/models';
import Company from './Company';

interface SystemSettingCreationAttributes extends Optional<ISystemSetting, 'id' | 'createdAt' | 'updatedAt'> {}

class SystemSetting extends Model<ISystemSetting, SystemSettingCreationAttributes> implements ISystemSetting {
  declare id: string;
  declare companyId: string;
  declare category: string;
  declare key: string;
  declare value: string;
  declare dataType: 'string' | 'number' | 'boolean' | 'json' | 'date';
  declare description?: string;
  declare isEditable: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare updatedBy: string;
}

SystemSetting.init(
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
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    key: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    dataType: {
      type: DataTypes.ENUM('string', 'number', 'boolean', 'json', 'date'),
      allowNull: false,
      defaultValue: 'string',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isEditable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'system_settings',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['companyId', 'key'],
      },
      {
        fields: ['category'],
      },
    ],
  }
);

SystemSetting.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Company.hasMany(SystemSetting, { foreignKey: 'companyId', as: 'settings' });

export default SystemSetting;
