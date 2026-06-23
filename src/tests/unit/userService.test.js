// tests/unit/userService.test.js — Unit tests for userService
const userService = require('../../services/userService');
const db = require('../../db/connection');

jest.mock('../../db/connection');

describe('userService.getUser', () => {
  it('returns user when found', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 1, email: 'a@b.com' }] });
    const user = await userService.getUser(1);
    expect(user.email).toBe('a@b.com');
  });

  // BUG 1: No test for user NOT found — undefined return is untested
  // BUG 2: No test for DB error case

  it('creates user with correct data', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 2, email: 'x@y.com' }] });
    // BUG 3: Test passes plaintext password — does not verify hashing occurs
    const user = await userService.createUser({ email: 'x@y.com', password: 'plaintext' });
    expect(user.email).toBe('x@y.com');
  });
});
