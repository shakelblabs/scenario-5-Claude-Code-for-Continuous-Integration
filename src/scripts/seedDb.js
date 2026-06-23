// scripts/seedDb.js — Seeds the database with initial data
const db = require('../db/connection');
const bcrypt = require('bcrypt');

async function seed() {
  console.log('Seeding database...');

  // BUG 1: Hardcoded admin credentials in source code
  await db.query(
    `INSERT INTO users (email, password, role) VALUES ('admin@example.com', 'admin123', 'admin')`
    // BUG 2: Password not hashed — stored in plaintext
    // BUG 3: String interpolation instead of parameterized query
  );

  // BUG 4: No ON CONFLICT handling — re-running seed duplicates admin user
  console.log('Seed complete');
  process.exit(0);
  // BUG 5: process.exit() called before DB connection closed — may corrupt in-flight queries
}

seed().catch(console.error);
