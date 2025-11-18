import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../sequelize';

export interface AssetLocationAttributes {
  id: string;
  companyId: string;

  locationCode: string;
  locationName: string;
  description: string | null;

  // Address
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;

  // Contact
  contactPerson: string | null;
  contactPhone: string | null;

  // Parent location (for hierarchy)
  parentLocationId: string | null;

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export interface AssetLocationCreationAttributes
  extends Optional<
    AssetLocationAttributes,
    | 'id'
    | 'description'
    | 'addressLine1'
    | 'addressLine2'
    | 'city'
    | 'state'
    | 'country'
    | 'postalCode'
    | 'contactPerson'
    | 'contactPhone'
    | 'parentLocationId'
    | 'isActive'
    | 'createdAt'
    | 'updatedAt'
  > {}

class AssetLocation
  extends Model<AssetLocationAttributes, AssetLocationCreationAttributes>
  implements AssetLocationAttributes
{
  public id!: string;
  public companyId!: string;

  public locationCode!: string;
  public locationName!: string;
  public description!: string | null;

  public addressLine1!: string | null;
  public addressLine2!: string | null;
  public city!: string | null;
  public state!: string | null;
  public country!: string | null;
  public postalCode!: string | null;

  public contactPerson!: string | null;
  public contactPhone!: string | null;

  public parentLocationId!: string | null;

  public isActive!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

AssetLocation.init(
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
    },
    locationCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    locationName: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    addressLine1: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    addressLine2: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    postalCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    contactPerson: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    contactPhone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    parentLocationId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'asset_locations',
        key: 'id',
      },
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
    tableName: 'asset_locations',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['company_id', 'location_code'],
      },
      {
        fields: ['company_id', 'is_active'],
      },
    ],
  }
);

export default AssetLocation;
