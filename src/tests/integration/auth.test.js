// tests/integration/auth.test.js — Integration tests for auth endpoints
const request = require('supertest');
const app = require('../../app');

describe('POST /auth/login', () => {
  it('returns token on valid credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'password123' });
      // BUG 1: Hardcoded real-looking credentials in test file — bad practice

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    // BUG 2: Doesn't verify token is a valid JWT or has correct claims
  });

  it('rejects invalid credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'wrong@example.com', password: 'wrong' });

    expect(res.status).toBe(401);
    // BUG 3: No test for missing body fields (email/password undefined)
  });
});
