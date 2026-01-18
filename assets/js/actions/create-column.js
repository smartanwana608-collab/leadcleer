// ===================================
// CREATE NEW COLUMN (ACTION) — SAFE V1
// ===================================

/**
 * Create a new column with empty values
 * (Default column name: "New Column")
 *
 * @param {Array} headers
 * @param {Array} rows
 * @returns {Object}
 */
function createNewColumn(headers, rows) {
  const columnName = "New Column";

  // Prevent duplicate column
  if (headers.map(h => h.toLowerCase()).includes(columnName.toLowerCase())) {
    return {
      headers,
      rows
    };
  }

  const newHeaders = [...headers, columnName];

  const newRows = rows.map(row => [...row, ""]);

  return {
    headers: newHeaders,
    rows: newRows
  };
}

// ===================================
// EXPORT FOR PROMPT ENGINE
// ===================================
window.createNewColumn = createNewColumn;
