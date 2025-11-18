import { Sequelize } from 'sequelize';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/erp_finance';
const DB_SSL = process.env.DB_SSL === 'true';

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: DB_SSL ? {
      require: true,
      rejectUnauthorized: false,
    } : false,
  },
  pool: {
    max: 20,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: false,
  },
});

export default sequelize;

// Test connection
export async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    return false;
  }
}

// Sync models (only in development)
export async function syncModels(force = false) {
  try {
    await sequelize.sync({ force, alter: !force });
    console.log('Database models synchronized successfully.');
    return true;
  } catch (error) {
    console.error('Error synchronizing database models:', error);
    return false;
  }
}
