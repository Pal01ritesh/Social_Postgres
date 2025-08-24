#!/usr/bin/env node

import dotenv from 'dotenv';
import { pool } from '../config/postgresql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const setupDatabase = async () => {
  try {
    console.log('Setting up PostgreSQL database...');
    console.log(`Connecting to: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
    
    const schemaPath = path.join(__dirname, '../config/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await pool.query(schema);
    console.log('Database schema created successfully');
    
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('Database connection test successful:', result.rows[0].current_time);
    
    console.log('PostgreSQL database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase();
}

export default setupDatabase; 