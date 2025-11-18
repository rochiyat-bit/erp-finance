import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../sequelize';
import { FiscalYear as IFiscalYear } from '@/types/models';
import Company from './Company';

interface FiscalYearCreationAttributes extends Optional<IFiscalYear, 'id' | 'createdAt' | 'updatedAt'> {}

class FiscalYear extends Model<IFiscalYear, FiscalYearCreationAttributes> implements IFiscalYear {
  declare id: string;
  declare companyId: string;
  declare year: number;
  declare startDate: Date;
  declare endDate: Date;
  declare status: 'open' | 'closed' | 'locked';
  declare closedAt?: Date;
  declare closedBy?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

FiscalYear.init(
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
    year: {
      type: DataTypes.INTEGER,
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
    tableName: 'fiscal_years',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['companyId', 'year'],
      },
    ],
  }
);

FiscalYear.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Company.hasMany(FiscalYear, { foreignKey: 'companyId', as: 'fiscalYears' });

export default FiscalYear;
