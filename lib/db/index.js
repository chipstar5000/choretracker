const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Determine if we should use PostgreSQL or SQLite
const usePostgres = process.env.PG_CONNECTION_STRING && process.env.USE_POSTGRES === 'true';

// Make sure the data directory exists
const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}

// SQLite database path
const sqliteDbPath = path.join(dbDir, 'choretracker.db');

// PostgreSQL pool (only created if using Postgres)
let pool;
if (usePostgres) {
  // Parse the connection string to check for SSL parameters
  const pgConnectionString = process.env.PG_CONNECTION_STRING;
  const includesSsl = pgConnectionString && 
    (pgConnectionString.includes('sslmode=require') || 
     pgConnectionString.includes('ssl=true'));
  
  // Log connection attempt (without sensitive details)
  console.log(`Connecting to PostgreSQL database${includesSsl ? ' with SSL' : ''}`);
  
  // Create the pool with appropriate SSL settings
  pool = new Pool({
    connectionString: pgConnectionString,
    // For Neon, we generally need SSL in production
    ssl: process.env.NODE_ENV === 'production' || includesSsl 
      ? { rejectUnauthorized: false } 
      : false
  });
  
  // Test the connection
  pool.on('connect', () => {
    console.log('Connected to PostgreSQL database');
  });
  
  pool.on('error', (err) => {
    console.error('PostgreSQL pool error:', err.message);
  });
}

// Function to run SQL on SQLite
function runSqliteQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(sqliteDbPath);
    db.run(sql, params, function(err) {
      if (err) {
        db.close();
        return reject(err);
      }
      db.close();
      resolve({ rows: [], rowCount: this.changes });
    });
  });
}

// Function to query SQLite
function querySqlite(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(sqliteDbPath);
    
    // Check if it's a SELECT query
    const isSelect = sql.trim().toLowerCase().startsWith('select');
    
    if (isSelect) {
      db.all(sql, params, (err, rows) => {
        db.close();
        if (err) return reject(err);
        resolve({ rows, rowCount: rows.length });
      });
    } else {
      db.run(sql, params, function(err) {
        db.close();
        if (err) return reject(err);
        resolve({ 
          rows: this.lastID ? [{ id: this.lastID }] : [],
          rowCount: this.changes
        });
      });
    }
  });
}

// SQLite client with transaction support
function getSqliteClient() {
  const db = new sqlite3.Database(sqliteDbPath);
  
  return {
    query: (sql, params = []) => {
      return new Promise((resolve, reject) => {
        if (sql.trim().toLowerCase().startsWith('select')) {
          db.all(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve({ rows, rowCount: rows.length });
          });
        } else {
          db.run(sql, params, function(err) {
            if (err) return reject(err);
            resolve({ 
              rows: this.lastID ? [{ id: this.lastID }] : [], 
              rowCount: this.changes 
            });
          });
        }
      });
    },
    release: () => {
      db.close();
    }
  };
}

// Initialize the database with tables if they don't exist
async function initializeDatabase() {
  if (usePostgres) {
    // PostgreSQL initialization
    console.log('Initializing PostgreSQL database...');
    
    let client;
    try {
      // Test the connection first
      client = await pool.connect();
      console.log('Successfully connected to PostgreSQL database for initialization');
      
      // Create family members table
      console.log('Creating family_members table if not exists...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS family_members (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          color VARCHAR(50) NOT NULL
        );
      `);

      // Create chores table
      console.log('Creating chores table if not exists...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS chores (
          id SERIAL PRIMARY KEY,
          name VARCHAR(200) NOT NULL,
          details TEXT,
          due_date DATE NOT NULL,
          repeat_type VARCHAR(20) CHECK (repeat_type IN ('one-time', 'daily', 'weekly')),
          completed BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create assignments junction table
      console.log('Creating chore_assignments table if not exists...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS chore_assignments (
          id SERIAL PRIMARY KEY,
          chore_id INTEGER REFERENCES chores(id) ON DELETE CASCADE,
          family_member_id INTEGER REFERENCES family_members(id) ON DELETE CASCADE,
          completed BOOLEAN DEFAULT FALSE,
          completed_at TIMESTAMP WITH TIME ZONE,
          UNIQUE(chore_id, family_member_id)
        );
      `);

      // Insert default family members if they don't exist
      const familyMembers = [
        { name: 'Chip', color: 'blue' },
        { name: 'Catherine', color: 'green' },
        { name: 'Charlotte', color: 'pink' },
        { name: 'Celine', color: 'purple' }
      ];

      console.log('Adding default family members if they do not exist...');
      for (const member of familyMembers) {
        const checkResult = await client.query(
          'SELECT id FROM family_members WHERE name = $1',
          [member.name]
        );
        
        if (checkResult.rows.length === 0) {
          console.log(`Adding family member: ${member.name}`);
          await client.query(
            'INSERT INTO family_members (name, color) VALUES ($1, $2)',
            [member.name, member.color]
          );
        }
      }
      
      console.log('PostgreSQL database initialization completed successfully');
    } catch (error) {
      console.error('Error during PostgreSQL database initialization:', error);
      throw new Error(`PostgreSQL initialization failed: ${error.message}`);
    } finally {
      if (client) {
        client.release();
      }
    }
  } else {
    // SQLite initialization
    console.log('Initializing SQLite database...');
    const db = new sqlite3.Database(sqliteDbPath);
    
    try {
      // Create family members table
      console.log('Creating family_members table if not exists...');
      await new Promise((resolve, reject) => {
        db.run(`
          CREATE TABLE IF NOT EXISTS family_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            color TEXT NOT NULL
          )
        `, err => err ? reject(err) : resolve());
      });

      // Create chores table
      console.log('Creating chores table if not exists...');
      await new Promise((resolve, reject) => {
        db.run(`
          CREATE TABLE IF NOT EXISTS chores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            details TEXT,
            due_date TEXT NOT NULL,
            repeat_type TEXT CHECK (repeat_type IN ('one-time', 'daily', 'weekly')),
            completed INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
          )
        `, err => err ? reject(err) : resolve());
      });

      // Create assignments junction table
      console.log('Creating chore_assignments table if not exists...');
      await new Promise((resolve, reject) => {
        db.run(`
          CREATE TABLE IF NOT EXISTS chore_assignments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chore_id INTEGER,
            family_member_id INTEGER,
            completed INTEGER DEFAULT 0,
            completed_at TEXT,
            UNIQUE(chore_id, family_member_id),
            FOREIGN KEY (chore_id) REFERENCES chores(id) ON DELETE CASCADE,
            FOREIGN KEY (family_member_id) REFERENCES family_members(id) ON DELETE CASCADE
          )
        `, err => err ? reject(err) : resolve());
      });

      // Insert default family members if they don't exist
      console.log('Adding default family members if they do not exist...');
      const familyMembers = [
        { name: 'Chip', color: 'blue' },
        { name: 'Catherine', color: 'green' },
        { name: 'Charlotte', color: 'pink' },
        { name: 'Celine', color: 'purple' }
      ];

      for (const member of familyMembers) {
        await new Promise((resolve, reject) => {
          db.get('SELECT id FROM family_members WHERE name = ?', [member.name], (err, row) => {
            if (err) return reject(err);
            
            if (!row) {
              console.log(`Adding family member: ${member.name}`);
              db.run('INSERT INTO family_members (name, color) VALUES (?, ?)', 
                [member.name, member.color], 
                err => err ? reject(err) : resolve()
              );
            } else {
              resolve();
            }
          });
        });
      }
      
      console.log('SQLite database initialization completed successfully');
    } catch (error) {
      console.error('Error during SQLite database initialization:', error);
      throw new Error(`SQLite initialization failed: ${error.message}`);
    } finally {
      db.close();
    }
  }
}

// Export different interfaces depending on database type
module.exports = {
  query: usePostgres 
    ? (text, params) => pool.query(text, params)
    : querySqlite,
  getClient: usePostgres 
    ? () => pool.connect()
    : getSqliteClient,
  initializeDatabase
};