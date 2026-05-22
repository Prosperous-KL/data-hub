import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function test() {
  try {
    const res = await pool.query('SELECT NOW() as time');
    console.log('Connected ✅', res.rows[0].time);
  } catch (err) {
    console.error('Failed ❌', err.message);
  } finally {
    await pool.end();
  }
}

test();