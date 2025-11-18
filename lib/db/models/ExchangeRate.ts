import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../sequelize';
import { ExchangeRate as IExchangeRate } from '@/types/models';
import Company from './Company';

interface ExchangeRateCreationAttributes extends Optional<IExchangeRate, 'id' | 'createdAt'> {}

class ExchangeRate extends Model<IExchangeRate, ExchangeRateCreationAttributes> implements IExchangeRate {
  declare id: string;
  declare companyId: string;
  declare fromCurrencyCode: string;
  declare toCurrencyCode: string;
  declare rate: number;
  declare effectiveDate: Date;
  declare source: 'manual' | 'api' | 'system';
  declare createdAt: Date;
  declare createdBy: string;
}

ExchangeRate.init(
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
    fromCurrencyCode: {
      type: DataTypes.STRING(3),
      allowNull: false,
    },
    toCurrencyCode: {
      type: DataTypes.STRING(3),
      allowNull: false,
    },
    rate: {
      type: DataTypes.DECIMAL(18, 6),
      allowNull: false,
    },
    effectiveDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    source: {
      type: DataTypes.ENUM('manual', 'api', 'system'),
      allowNull: false,
      defaultValue: 'manual',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'exchange_rates',
    timestamps: false,
    indexes: [
      {
        fields: ['companyId', 'effectiveDate'],
      },
      {
        fields: ['fromCurrencyCode', 'toCurrencyCode', 'effectiveDate'],
      },
    ],
  }
);

ExchangeRate.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Company.hasMany(ExchangeRate, { foreignKey: 'companyId', as: 'exchangeRates' });

export default ExchangeRate;
