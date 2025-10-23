import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(__dirname, '../../database.sqlite');
const schemaPath = path.join(__dirname, '../models/schema.sql');

// Create database if it doesn't exist
if (!fs.existsSync(dbPath)) {
  const db = new Database(dbPath);
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
  db.close();
  console.log('Database created successfully');
}

// Initialize database connection
const db = new Database(dbPath);

// Enable foreign key constraints
db.pragma('foreign_keys = ON');

export default db;
