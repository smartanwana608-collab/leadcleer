// ===================================
// REMOVE ROWS MISSING EMAIL (ACTION)
// ===================================

/**
 * Detect email column indexes automatically
 */
function findEmailColumns(headers) {
  return headers
    .map((h, i) => ({ name: h.toLowerCase(), index: i }))
    .filter(col => col.name.includes("email"))
    .map(col => col.index);
}

/**
 * Remove rows that do not contain an email
 *
 * @param {Array} headers
 * @param {Array} rows
 * @returns {Array} filtered rows
 */
export function removeMissingEmail(headers, rows) {
  const emailIndexes = findEmailColumns(headers);

  // If no email column exists, return rows unchanged
  if (!emailIndexes.length) return rows;

  return rows.filter(row =>
    emailIndexes.some(index => {
      const value = row[index];
      return value && value.toString().trim() !== "";
    })
  );
}
