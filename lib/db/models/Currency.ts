import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../sequelize';
import { Currency as ICurrency } from '@/types/models';
import Company from './Company';

interface CurrencyCreationAttributes extends Optional<ICurrency, 'id' | 'createdAt' | 'updatedAt'> {}

class Currency extends Model<ICurrency, CurrencyCreationAttributes> implements ICurrency {
  declare id: string;
  declare companyId: string;
  declare code: string;
  declare name: string;
  declare symbol: string;
  declare decimalPlaces: number;
  declare isBaseCurrency: boolean;
  declare isActive: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Currency.init(
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
      type: DataTypes.STRING(3),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    symbol: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    decimalPlaces: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 2,
    },
    isBaseCurrency: {
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
  },
  {
    sequelize,
    tableName: 'currencies',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['companyId', 'code'],
      },
    ],
  }
);

Currency.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Company.hasMany(Currency, { foreignKey: 'companyId', as: 'currencies' });

export default Currency;
