// utils/pagination.js — Pagination helper for list endpoints
function paginate(query, page, pageSize) {
  // BUG 1: No validation — page or pageSize could be NaN, negative, or zero
  const offset = (page - 1) * pageSize;
  // BUG 2: If page=0, offset is -pageSize — invalid SQL OFFSET

  return {
    ...query,
    limit: pageSize,
    offset: offset,
  };
}

function buildSortClause(field, direction) {
  // BUG 3: SQL injection — field and direction are interpolated directly
  return `ORDER BY ${field} ${direction}`;
}

module.exports = { paginate, buildSortClause };
