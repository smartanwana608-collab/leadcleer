// ===================================
// REMOVE ROWS MISSING EMAIL (ACTION)
// ===================================

/**
 * Find all email column indexes
 */
function findEmailColumns(headers) {
  return headers
    .map((h, i) => ({ name: h.toLowerCase(), index: i }))
    .filter(col => col.name.includes("email"))
    .map(col => col.index);
}

/**
 * Check if a row has at least one email
 */
function rowHasEmail(row, emailIndexes) {
  return emailIndexes.some(index => {
    const value = row[index];
    return value && value.toString().trim() !== "";
  });
}

/**
 * Remove rows missing email
 *
 * @param {Array} headers
 * @param {Array} rows
 * @returns {Object}
 */
function removeMissingEmail(headers, rows) {
  const emailIndexes = findEmailColumns(headers);

  if (!emailIndexes.length) {
    throw new Error("No email column found in CSV");
  }

  const withEmail = [];
  const withoutEmail = [];

  rows.forEach(row => {
    rowHasEmail(row, emailIndexes)
      ? withEmail.push(row)
      : withoutEmail.push(row);
  });

  return {
    headers,
    withEmail,
    withoutEmail
  };
}

// ===================================
// EXPORT FOR PROMPT ENGINE
// ===================================
window.removeMissingEmail = removeMissingEmail;
