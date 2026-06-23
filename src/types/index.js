// types/index.js — Shared type definitions (JSDoc)

/**
 * @typedef {Object} UserPayload
 * @property {number} id
 * @property {string} email
 * @property {string} password   // BUG 1: Password included in payload type — propagates to API responses
 * @property {string} name
 * @property {'user'|'admin'} role
 */

/**
 * @typedef {Object} PaginatedResponse
 * @property {Array} data
 * @property {number} total
 * @property {number} page
 * // BUG 2: Missing `pageSize` and `totalPages` fields — callers can't determine last page
 */

/**
 * @typedef {Object} ApiError
 * @property {string} error
 * // BUG 3: No `code` or `statusCode` field — frontend can't handle errors programmatically
 */

module.exports = {};
