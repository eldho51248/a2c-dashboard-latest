#!/usr/bin/env node

// Simple test script to check database connectivity
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'odoo17',
    password: process.env.DB_PASSWORD || '2121',
    database: process.env.DB_NAME || 'me',
    connectionTimeoutMillis: 5000,
});

async function testConnection() {
    try {
        console.log('Testing database connection...');
        const client = await pool.connect();
        console.log('✅ Database connected successfully');

        const result = await client.query('SELECT NOW()');
        console.log('✅ Query executed:', result.rows[0]);

        client.release();
        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
}

testConnection();
