// models/User.js — User model schema definition
class User {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.password = data.password;
    // BUG 1: Password included in model instance — gets serialized in JSON responses
    this.name = data.name;
    this.createdAt = data.created_at;
    this.role = data.role || 'user';
  }

  toJSON() {
    // BUG 2: toJSON() does not omit password — JSON.stringify exposes it
    return {
      id: this.id,
      email: this.email,
      password: this.password,
      name: this.name,
      role: this.role,
    };
  }

  isAdmin() {
    return this.role === 'admin';
    // Style: could be a getter — NOT a bug, cosmetic
  }
}

module.exports = User;
