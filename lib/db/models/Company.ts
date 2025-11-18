import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../sequelize';
import { Company as ICompany } from '@/types/models';

interface CompanyCreationAttributes extends Optional<ICompany, 'id' | 'createdAt' | 'updatedAt'> {}

class Company extends Model<ICompany, CompanyCreationAttributes> implements ICompany {
  declare id: string;
  declare name: string;
  declare displayName: string;
  declare taxId: string;
  declare registrationNumber: string;
  declare email: string;
  declare phone: string;
  declare address: string;
  declare city: string;
  declare state: string;
  declare country: string;
  declare postalCode: string;
  declare website?: string;
  declare logo?: string;

  declare baseCurrency: string;
  declare fiscalYearStart: number;
  declare fiscalYearEnd: number;
  declare dateFormat: string;
  declare numberFormat: string;
  declare timeZone: string;

  declare subscriptionPlan: 'trial' | 'basic' | 'professional' | 'enterprise';
  declare subscriptionStatus: 'active' | 'suspended' | 'cancelled';
  declare subscriptionStartDate: Date;
  declare subscriptionEndDate: Date;
  declare maxUsers: number;
  declare maxTransactionsPerMonth: number;

  declare isActive: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare createdBy: string;
  declare updatedBy: string;
}

Company.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    displayName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    taxId: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    registrationNumber: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    postalCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    logo: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    baseCurrency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
    },
    fiscalYearStart: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
        max: 12,
      },
    },
    fiscalYearEnd: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 12,
      validate: {
        min: 1,
        max: 12,
      },
    },
    dateFormat: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'DD/MM/YYYY',
    },
    numberFormat: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: '1,000.00',
    },
    timeZone: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'UTC',
    },
    subscriptionPlan: {
      type: DataTypes.ENUM('trial', 'basic', 'professional', 'enterprise'),
      allowNull: false,
      defaultValue: 'trial',
    },
    subscriptionStatus: {
      type: DataTypes.ENUM('active', 'suspended', 'cancelled'),
      allowNull: false,
      defaultValue: 'active',
    },
    subscriptionStartDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    subscriptionEndDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    maxUsers: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
    },
    maxTransactionsPerMonth: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1000,
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
    tableName: 'companies',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['email'],
      },
      {
        unique: true,
        fields: ['taxId'],
      },
    ],
  }
);

export default Company;
