/**
 * Jest global setup:
 *  1) creates the test DB if it doesn't exist (connecting to the default 'postgres' DB);
 *  2) syncs Sequelize models against the freshly empty test DB.
 */

require('dotenv').config();
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_for_diplomahub';

const { Client } = require('pg');

const TEST_DB = process.env.TEST_DB_NAME || 'diploma_platform_test';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;

module.exports = async () => {
  // 1) Ensure test DB exists.
  const admin = new Client({
    user: DB_USER,
    password: DB_PASSWORD,
    host: DB_HOST,
    port: DB_PORT,
    database: 'postgres',
  });
  await admin.connect();
  const { rows } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [TEST_DB]);
  if (rows.length === 0) {
    await admin.query(`CREATE DATABASE "${TEST_DB}"`);
  }
  await admin.end();

  // 2) Sync schema in the test DB.
  const { sequelize } = require('../../src/models');
  await sequelize.sync({ force: true });
  await sequelize.close();
};
