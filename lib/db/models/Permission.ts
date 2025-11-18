import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../sequelize';
import { Permission as IPermission } from '@/types/models';

interface PermissionCreationAttributes extends Optional<IPermission, 'id' | 'createdAt' | 'updatedAt'> {}

class Permission extends Model<IPermission, PermissionCreationAttributes> implements IPermission {
  declare id: string;
  declare module: string;
  declare code: string;
  declare name: string;
  declare description?: string;
  declare category: string;
  declare isActive: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Permission.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    module: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
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
  },
  {
    sequelize,
    tableName: 'permissions',
    timestamps: true,
    indexes: [
      {
        fields: ['module'],
      },
      {
        fields: ['category'],
      },
    ],
  }
);

export default Permission;
