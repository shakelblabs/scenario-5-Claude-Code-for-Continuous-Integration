// config/config.js — Application configuration loader
const config = {
  jwtSecret: process.env.JWT_SECRET || 'secret123',
  // BUG 1: Hardcoded fallback secret — if env var missing, app runs insecurely in prod

  dbUrl: process.env.DATABASE_URL,
  // No validation that DATABASE_URL is set

  port: process.env.PORT || 3000,

  bcryptRounds: 10,

  // BUG 2: No NODE_ENV check — debug flags could be on in production
  debug: true,

  // BUG 3: CORS set to wildcard with no environment awareness
  corsOrigin: '*',
};

module.exports = config;
