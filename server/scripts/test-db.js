#!/usr/bin/env node

import dotenv from 'dotenv';
import { pool } from '../config/postgresql.js';

// Load environment variables
dotenv.config();

const testConnection = async () => {
  try {
    console.log('🔧 Testing Database Connection...');
    console.log(`📊 Host: ${process.env.DB_HOST}`);
    console.log(`📊 Port: ${process.env.DB_PORT}`);
    console.log(`📊 Database: ${process.env.DB_NAME}`);
    console.log(`📊 User: ${process.env.DB_USER}`);
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    console.log('📅 Current time:', result.rows[0].current_time);
    console.log('🗄️ Database version:', result.rows[0].db_version.split('\n')[0]);
    
    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('⚠️ No tables found in database');
    } else {
      console.log('📋 Existing tables:', tablesResult.rows.map(row => row.table_name).join(', '));
    }
    
    client.release();
    console.log('🎯 Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('🔍 Error details:', error);
  } finally {
    await pool.end();
  }
};

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testConnection();
}

export default testConnection; 