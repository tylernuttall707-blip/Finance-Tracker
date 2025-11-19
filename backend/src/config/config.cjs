require('dotenv').config();
const path = require('path');

const useSQLite = process.env.USE_SQLITE === 'true';

// Build development config based on USE_SQLITE environment variable
const developmentConfig = useSQLite
  ? {
      dialect: 'sqlite',
      storage: path.join(__dirname, '../../database.sqlite'),
    }
  : {
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'finance_tracker',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      dialect: 'postgres',
    };

module.exports = {
  development: developmentConfig,
  test: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'finance_tracker_test',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: 'postgres',
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: 'postgres',
  },
};
