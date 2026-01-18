// ===================================
// SPLIT CSV BY COLUMN (ACTION)
// ===================================

/**
 * Find column index by name (case-insensitive)
 */
function findColumnIndex(headers, columnName) {
  return headers.findIndex(
    h => h.toLowerCase().trim() === columnName.toLowerCase().trim()
  );
}

/**
 * Split rows by column value
 *
 * @param {Array} headers
 * @param {Array} rows
 * @param {String} columnName
 * @returns {Object}
 */
function splitByColumn(headers, rows, columnName) {
  const columnIndex = findColumnIndex(headers, columnName);

  if (columnIndex === -1) {
    throw new Error(`Column "${columnName}" not found in CSV`);
  }

  const groups = {};

  rows.forEach(row => {
    const key = row[columnIndex] || "EMPTY";

    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push(row);
  });

  return {
    headers,
    groups
  };
}

// ===================================
// EXPORT FOR PROMPT ENGINE
// ===================================
window.splitByColumn = splitByColumn;
