// MySQL Connection Test Script
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
  console.log('🔍 Testing MySQL Connection...\n');
  console.log('Configuration:');
  console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`  User: ${process.env.DB_USER || 'root'}`);
  console.log(`  Database: ${process.env.DB_NAME || 'atlascopco_qa'}`);
  console.log(`  Password: ${process.env.DB_PASSWORD ? '***' : '(empty)'}\n`);

  try {
    // Test connection without selecting database first
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });

    console.log('✅ Successfully connected to MySQL server!\n');

    // Check if database exists
    const [databases] = await connection.query(
      `SHOW DATABASES LIKE '${process.env.DB_NAME || 'atlascopco_qa'}'`
    );

    if (databases.length > 0) {
      console.log(`✅ Database '${process.env.DB_NAME}' exists\n`);
      
      // Connect to the database and check tables
      await connection.changeUser({ database: process.env.DB_NAME });
      
      const [tables] = await connection.query('SHOW TABLES');
      console.log('📊 Tables found:');
      if (tables.length > 0) {
        tables.forEach(table => {
          const tableName = Object.values(table)[0];
          console.log(`  ✓ ${tableName}`);
        });
        console.log('');

        // Check row counts
        for (const table of tables) {
          const tableName = Object.values(table)[0];
          const [count] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
          console.log(`  ${tableName}: ${count[0].count} rows`);
        }
      } else {
        console.log('  ⚠️  No tables found. Run database-schema.sql to create tables.');
      }
    } else {
      console.log(`❌ Database '${process.env.DB_NAME}' does NOT exist`);
      console.log(`\nTo create it, run these commands in MySQL:\n`);
      console.log(`CREATE DATABASE ${process.env.DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
      console.log(`USE ${process.env.DB_NAME};`);
      console.log(`SOURCE database-schema.sql;`);
    }

    await connection.end();
    console.log('\n✅ MySQL connection test completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ MySQL Connection Failed!\n');
    console.error('Error:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Solution: Check your MySQL username and password in .env file');
      console.error('   Update DB_USER and DB_PASSWORD values');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Solution: Make sure MySQL service is running');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('\n💡 Solution: Database does not exist. Create it first.');
    }
    
    process.exit(1);
  }
}

testConnection();
