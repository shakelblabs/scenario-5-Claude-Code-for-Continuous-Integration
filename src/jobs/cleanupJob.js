// jobs/cleanupJob.js — Deletes expired sessions from DB
const db = require('../db/connection');

let isRunning = false;

async function cleanupExpiredSessions() {
  // BUG 1: Race condition — isRunning check + set is not atomic
  // Two concurrent calls can both pass the check before either sets the flag
  if (isRunning) return;
  isRunning = true;

  try {
    const result = await db.query(
      'DELETE FROM sessions WHERE expires_at < NOW()'
    );
    console.log(`Cleaned up ${result.rowCount} expired sessions`);
  } catch (err) {
    // BUG 2: Error swallowed — no alerting or retry logic
    console.error('Cleanup failed:', err);
  } finally {
    isRunning = false;
  }
}

// BUG 3: No scheduling guard — if called from multiple workers, runs in parallel
setInterval(cleanupExpiredSessions, 60 * 1000);

module.exports = { cleanupExpiredSessions };
