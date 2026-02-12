// Backend API Server for MySQL Database
// This Express.js server handles all database operations
// Place this file in your backend/server directory

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'atlascopco_qa',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Test database connection
pool.getConnection()
  .then(connection => {
    console.log('✅ MySQL database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('❌ MySQL connection error:', err);
  });

// Helper function to convert ISO datetime to MySQL format
function convertToMySQLDateTime(value) {
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/)) {
    // Convert ISO 8601 format to MySQL datetime format
    return value.slice(0, 19).replace('T', ' ');
  }
  return value;
}

// Helper function to prepare record values for MySQL
function prepareRecordValues(record) {
  const prepared = {};
  for (const [key, value] of Object.entries(record)) {
    prepared[key] = convertToMySQLDateTime(value);
  }
  return prepared;
}

// Helper function to build WHERE clause
function buildWhereClause(conditions, orConditions, inConditions) {
  const whereParts = [];
  const params = [];

  // Handle regular WHERE conditions
  conditions.forEach(condition => {
    // Handle NULL values with IS NULL / IS NOT NULL
    if (condition.value === null) {
      if (condition.operator === '=') {
        whereParts.push(`${condition.field} IS NULL`);
      } else if (condition.operator === '!=') {
        whereParts.push(`${condition.field} IS NOT NULL`);
      } else {
        whereParts.push(`${condition.field} ${condition.operator} ?`);
        params.push(condition.value);
      }
    } else {
      whereParts.push(`${condition.field} ${condition.operator} ?`);
      params.push(condition.value);
    }
  });

  // Handle IN conditions
  inConditions.forEach(inCondition => {
    if (inCondition.values && inCondition.values.length > 0) {
      const placeholders = inCondition.values.map(() => '?').join(', ');
      whereParts.push(`${inCondition.field} IN (${placeholders})`);
      params.push(...inCondition.values);
    }
  });

  // Handle OR conditions
  if (orConditions && orConditions.length > 0) {
    const orParts = [];
    orConditions.forEach(orCondition => {
      // Parse OR condition string (e.g., "part_number.ilike.%search%,owner.ilike.%search%")
      const orClauses = orCondition.split(',');
      const orSubParts = [];
      
      orClauses.forEach(clause => {
        const parts = clause.split('.');
        if (parts.length >= 3) {
          const field = parts[0];
          const operator = parts[1];
          const value = parts.slice(2).join('.');
          
          if (operator === 'ilike') {
            orSubParts.push(`${field} LIKE ?`);
            params.push(value.replace(/%/g, '%'));
          } else if (operator === 'eq') {
            orSubParts.push(`${field} = ?`);
            params.push(value);
          }
        }
      });
      
      if (orSubParts.length > 0) {
        orParts.push(`(${orSubParts.join(' OR ')})`);
      }
    });
    
    if (orParts.length > 0) {
      whereParts.push(`(${orParts.join(' OR ')})`);
    }
  }

  return {
    whereClause: whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '',
    params,
  };
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// SELECT Query
app.post('/api/query', async (req, res) => {
  try {
    const {
      table,
      select = '*',
      where = [],
      or = [],
      in: inConditions = [],
      orderBy = null,
      orderDirection = 'asc',
      limit = null,
      offset = 0,
      single = false,
    } = req.body;

    // Build SELECT clause
    const selectClause = select === '*' ? '*' : select;

    // Build WHERE clause
    const { whereClause, params } = buildWhereClause(where, or, inConditions);

    // Build ORDER BY clause
    const orderByClause = orderBy ? `ORDER BY ${orderBy} ${orderDirection.toUpperCase()}` : '';

    // Build LIMIT clause
    const limitClause = limit ? `LIMIT ${limit} OFFSET ${offset}` : '';

    // Construct full query
    const query = `
      SELECT ${selectClause}
      FROM ${table}
      ${whereClause}
      ${orderByClause}
      ${limitClause}
    `.trim();

    console.log('Executing query:', query);
    console.log('With params:', params);

    const [rows] = await pool.execute(query, params);

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as count FROM ${table} ${whereClause}`;
    const [countResult] = await pool.execute(countQuery, params);
    const totalCount = countResult[0].count;

    res.json({
      data: single ? (rows[0] || null) : rows,
      count: totalCount,
    });
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ error: error.message });
  }
});

// INSERT Query
app.post('/api/insert', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { table, records } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'Records must be a non-empty array' });
    }

    await connection.beginTransaction();

    const insertedRecords = [];

    for (const record of records) {
      // Convert datetime values to MySQL format
      const preparedRecord = prepareRecordValues(record);
      const fields = Object.keys(preparedRecord);
      const values = Object.values(preparedRecord);
      const placeholders = fields.map(() => '?').join(', ');

      const query = `
        INSERT INTO ${table} (${fields.join(', ')})
        VALUES (${placeholders})
      `;

      const [result] = await connection.execute(query, values);
      
      // Fetch the inserted record
      const [inserted] = await connection.execute(
        `SELECT * FROM ${table} WHERE id = ?`,
        [preparedRecord.id || result.insertId]
      );
      
      insertedRecords.push(inserted[0]);
    }

    await connection.commit();

    res.json({
      data: insertedRecords,
      count: insertedRecords.length,
    });
  } catch (error) {
    await connection.rollback();
    console.error('Insert error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// UPDATE Query
app.post('/api/update', async (req, res) => {
  try {
    const { table, updates, where = [], in: inConditions = [] } = req.body;

    // Convert datetime values in updates to MySQL format
    const preparedUpdates = prepareRecordValues(updates);

    // Build SET clause
    const setFields = Object.keys(preparedUpdates);
    const setClause = setFields.map(field => `${field} = ?`).join(', ');
    const setParams = Object.values(preparedUpdates);

    // Build WHERE clause
    const { whereClause, params: whereParams } = buildWhereClause(where, [], inConditions);

    if (!whereClause) {
      return res.status(400).json({ error: 'WHERE clause is required for UPDATE' });
    }

    const query = `
      UPDATE ${table}
      SET ${setClause}
      ${whereClause}
    `;

    const params = [...setParams, ...whereParams];

    console.log('Executing update:', query);
    console.log('With params:', params);

    const [result] = await pool.execute(query, params);

    res.json({
      data: { affectedRows: result.affectedRows },
      count: result.affectedRows,
    });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE Query
app.post('/api/delete', async (req, res) => {
  try {
    const { table, where = [] } = req.body;

    // Build WHERE clause
    const { whereClause, params } = buildWhereClause(where, [], []);

    if (!whereClause) {
      return res.status(400).json({ error: 'WHERE clause is required for DELETE' });
    }

    const query = `
      DELETE FROM ${table}
      ${whereClause}
    `;

    console.log('Executing delete:', query);
    console.log('With params:', params);

    const [result] = await pool.execute(query, params);

    res.json({
      data: { affectedRows: result.affectedRows },
      count: result.affectedRows,
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${process.env.DB_NAME || 'atlascopco_qa'}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});
