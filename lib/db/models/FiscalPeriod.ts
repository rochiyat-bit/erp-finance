import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../sequelize';
import { FiscalPeriod as IFiscalPeriod } from '@/types/models';
import Company from './Company';
import FiscalYear from './FiscalYear';

interface FiscalPeriodCreationAttributes extends Optional<IFiscalPeriod, 'id' | 'createdAt' | 'updatedAt'> {}

class FiscalPeriod extends Model<IFiscalPeriod, FiscalPeriodCreationAttributes> implements IFiscalPeriod {
  declare id: string;
  declare companyId: string;
  declare fiscalYearId: string;
  declare periodNumber: number;
  declare name: string;
  declare startDate: Date;
  declare endDate: Date;
  declare status: 'open' | 'closed' | 'locked';
  declare closedAt?: Date;
  declare closedBy?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

FiscalPeriod.init(
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
    fiscalYearId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'fiscal_years',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    periodNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('open', 'closed', 'locked'),
      allowNull: false,
      defaultValue: 'open',
    },
    closedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    closedBy: {
      type: DataTypes.UUID,
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
    tableName: 'fiscal_periods',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['fiscalYearId', 'periodNumber'],
      },
      {
        fields: ['companyId', 'startDate', 'endDate'],
      },
    ],
  }
);

FiscalPeriod.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
FiscalPeriod.belongsTo(FiscalYear, { foreignKey: 'fiscalYearId', as: 'fiscalYear' });
FiscalYear.hasMany(FiscalPeriod, { foreignKey: 'fiscalYearId', as: 'periods' });

export default FiscalPeriod;
