import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../sequelize';
import { Role as IRole } from '@/types/models';
import Company from './Company';

interface RoleCreationAttributes extends Optional<IRole, 'id' | 'createdAt' | 'updatedAt'> {}

class Role extends Model<IRole, RoleCreationAttributes> implements IRole {
  declare id: string;
  declare companyId: string;
  declare name: string;
  declare code: string;
  declare description?: string;
  declare permissions: string[];
  declare isSystemRole: boolean;
  declare isActive: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare createdBy: string;
  declare updatedBy: string;
}

Role.init(
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
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    permissions: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    isSystemRole: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isActive: {
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
    tableName: 'roles',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['companyId', 'code'],
      },
    ],
  }
);

Role.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Company.hasMany(Role, { foreignKey: 'companyId', as: 'roles' });

export default Role;
