import pg from 'pg';
const { Pool } = pg;

// Create a connection pool to the PostgreSQL database
// This is a demo database, localhost and no password
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'bar_polling',
  user: 'liberatoaguilar',
  password: ''
});

// Test the connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.stack);
  } else {
    console.log('Database connected:', res.rows[0]);
  }
});

// Helper function to execute database queries
const query = async (text, params) => {
  try {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
};

export default defineEventHandler(async (event) => {
  // Demo endpoint
  return {
    message: 'Database API is running'
  };
});

// Export query function for use in other API endpoints
export { query }; 