import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../sequelize';

export interface AssetMaintenanceAttributes {
  id: string;
  companyId: string;
  assetId: string;

  // Maintenance Info
  maintenanceNumber: string;
  maintenanceDate: Date;
  maintenanceType: 'preventive' | 'corrective' | 'breakdown' | 'inspection' | 'calibration';

  // Service Provider
  serviceProvider: string | null;
  vendorId: string | null;
  technicianName: string | null;

  // Details
  description: string;
  workPerformed: string | null;
  partsReplaced: string | null;

  // Cost
  laborCost: number;
  partsCost: number;
  otherCosts: number;
  totalCost: number;

  // Billing
  billId: string | null;

  // Downtime
  downtimeHours: number | null;

  // Next Maintenance
  nextMaintenanceDate: Date | null;

  // Status
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

  notes: string | null;
  attachments: string[] | null;

  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface AssetMaintenanceCreationAttributes
  extends Optional<
    AssetMaintenanceAttributes,
    | 'id'
    | 'serviceProvider'
    | 'vendorId'
    | 'technicianName'
    | 'workPerformed'
    | 'partsReplaced'
    | 'laborCost'
    | 'partsCost'
    | 'otherCosts'
    | 'billId'
    | 'downtimeHours'
    | 'nextMaintenanceDate'
    | 'status'
    | 'notes'
    | 'attachments'
    | 'createdAt'
    | 'updatedAt'
    | 'updatedBy'
  > {}

class AssetMaintenance
  extends Model<AssetMaintenanceAttributes, AssetMaintenanceCreationAttributes>
  implements AssetMaintenanceAttributes
{
  public id!: string;
  public companyId!: string;
  public assetId!: string;

  public maintenanceNumber!: string;
  public maintenanceDate!: Date;
  public maintenanceType!: 'preventive' | 'corrective' | 'breakdown' | 'inspection' | 'calibration';

  public serviceProvider!: string | null;
  public vendorId!: string | null;
  public technicianName!: string | null;

  public description!: string;
  public workPerformed!: string | null;
  public partsReplaced!: string | null;

  public laborCost!: number;
  public partsCost!: number;
  public otherCosts!: number;
  public totalCost!: number;

  public billId!: string | null;

  public downtimeHours!: number | null;

  public nextMaintenanceDate!: Date | null;

  public status!: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

  public notes!: string | null;
  public attachments!: string[] | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public createdBy!: string;
  public updatedBy!: string;
}

AssetMaintenance.init(
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
    assetId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'fixed_assets',
        key: 'id',
      },
    },
    maintenanceNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    maintenanceDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    maintenanceType: {
      type: DataTypes.ENUM('preventive', 'corrective', 'breakdown', 'inspection', 'calibration'),
      allowNull: false,
    },
    serviceProvider: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    vendorId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'vendors',
        key: 'id',
      },
    },
    technicianName: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    workPerformed: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    partsReplaced: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    laborCost: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    partsCost: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    otherCosts: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    totalCost: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
    },
    billId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'bills',
        key: 'id',
      },
    },
    downtimeHours: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    nextMaintenanceDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'in_progress', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'scheduled',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    attachments: {
      type: DataTypes.ARRAY(DataTypes.STRING),
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
    tableName: 'asset_maintenances',
    timestamps: true,
    indexes: [
      {
        fields: ['company_id', 'asset_id'],
      },
      {
        fields: ['company_id', 'maintenance_date'],
      },
      {
        fields: ['company_id', 'status'],
      },
    ],
  }
);

export default AssetMaintenance;
