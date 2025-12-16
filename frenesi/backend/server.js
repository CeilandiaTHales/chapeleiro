const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-me';
const FRONTEND_URL = process.env.GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI ? process.env.GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI.split('/auth')[0] : 'http://localhost:8080';

app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// Database Connection
const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'postgres',
  port: 5432,
});

// --- GOOGLE AUTH STRATEGY ---
if (process.env.GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID && process.env.GOTRUE_EXTERNAL_GOOGLE_SECRET) {
  passport.use(new GoogleStrategy({
      clientID: process.env.GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOTRUE_EXTERNAL_GOOGLE_SECRET,
      callbackURL: "/api/auth/google/callback"
    },
    async function(accessToken, refreshToken, profile, cb) {
      const email = profile.emails[0].value;
      try {
        // Check if user exists
        let res = await pool.query('SELECT * FROM auth.users WHERE email = $1', [email]);
        let user = res.rows[0];

        if (!user) {
          // Create new user via Google
          res = await pool.query(
            "INSERT INTO auth.users (email, provider, role, last_sign_in) VALUES ($1, 'google', 'authenticated', NOW()) RETURNING *",
            [email]
          );
          user = res.rows[0];
        } else {
          // Update login time
          await pool.query('UPDATE auth.users SET last_sign_in = NOW() WHERE id = $1', [user.id]);
        }
        return cb(null, user);
      } catch (err) {
        return cb(err, null);
      }
    }
  ));
}

// Middleware: Verify JWT
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Failed to authenticate token' });
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  });
};

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'healthy', time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: 'unhealthy', error: err.message });
  }
});

// --- AUTH ROUTES ---

// 1. Email/Password Register
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO auth.users (email, encrypted_password, provider) VALUES ($1, $2, 'email') RETURNING id, email, role, created_at",
      [email, hashedPassword]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Email/Password Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM auth.users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const user = result.rows[0];
    if (user.provider === 'google') return res.status(400).json({ error: 'Please login with Google' });

    const validPassword = await bcrypt.compare(password, user.encrypted_password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid password' });

    await pool.query('UPDATE auth.users SET last_sign_in = NOW() WHERE id = $1', [user.id]);
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Google Login Start
app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// 4. Google Login Callback
app.get('/api/auth/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=google_failed' }),
  (req, res) => {
    // Generate JWT
    const token = jwt.sign({ id: req.user.id, role: req.user.role }, JWT_SECRET, { expiresIn: '24h' });
    // Redirect to Frontend with token
    res.redirect(`${FRONTEND_URL}?token=${token}`);
  }
);

// Get Users (Protected)
app.get('/api/auth/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, role, created_at, last_sign_in, provider FROM auth.users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- SCHEMA & DATA ROUTES ---

app.get('/api/tables', async (req, res) => {
  try {
    const query = `
      SELECT 
        t.table_name as name, 
        t.table_schema as schema,
        pg_class.reltuples::bigint as estimated_rows,
        pg_class.relrowsecurity as rls_enabled
      FROM information_schema.tables t
      JOIN pg_class ON pg_class.relname = t.table_name
      JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace AND pg_namespace.nspname = t.table_schema
      WHERE t.table_schema NOT IN ('information_schema', 'pg_catalog')
      ORDER BY t.table_schema, t.table_name;
    `;
    const result = await pool.query(query);
    const tables = await Promise.all(result.rows.map(async (table) => {
       try {
         const countRes = await pool.query(`SELECT COUNT(*) FROM "${table.schema}"."${table.name}"`);
         return { ...table, rowCount: parseInt(countRes.rows[0].count), rlsEnabled: table.rls_enabled };
       } catch (e) {
         return { ...table, rowCount: 0, rlsEnabled: false };
       }
    }));
    res.json(tables);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tables/:schema/:table/columns', async (req, res) => {
  try {
    const { schema, table } = req.params;
    const query = `
      SELECT column_name as name, data_type as type, is_nullable = 'YES' as "isNullable", column_default as "defaultValue"
      FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2
    `;
    const result = await pool.query(query, [schema, table]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tables/:schema/:table/data', async (req, res) => {
  try {
    const { schema, table } = req.params;
    if (!/^[a-zA-Z0-9_]+$/.test(schema) || !/^[a-zA-Z0-9_]+$/.test(table)) return res.status(400).json({ error: 'Invalid name' });
    const result = await pool.query(`SELECT * FROM "${schema}"."${table}" LIMIT 100`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sql', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query required' });
    const result = await pool.query(query);
    res.json({ rows: result.rows, rowCount: result.rowCount, command: result.command });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/functions', async (req, res) => {
  try {
    const query = `
      SELECT p.proname as name, pg_get_function_arguments(p.oid) as args, t.typname as "returnType", l.lanname as language, p.prosrc as definition
      FROM pg_proc p
      JOIN pg_language l ON p.prolang = l.oid
      JOIN pg_type t ON p.prorettype = t.oid
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/policies', async (req, res) => {
  try {
    const query = `
      SELECT pol.polname as name, tab.relname as table_name,
      CASE pol.polcmd WHEN 'r' THEN 'SELECT' WHEN 'a' THEN 'INSERT' WHEN 'w' THEN 'UPDATE' WHEN 'd' THEN 'DELETE' ELSE 'ALL' END as command,
      pg_get_expr(pol.polqual, pol.polrelid) as using, pg_get_expr(pol.polwithcheck, pol.polrelid) as check
      FROM pg_policy pol
      JOIN pg_class tab ON pol.polrelid = tab.oid
      JOIN pg_namespace n ON tab.relnamespace = n.oid
      WHERE n.nspname = 'public' OR n.nspname = 'auth'
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`IronDB API listening on port ${port}`);
});