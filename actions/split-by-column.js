// ===================================
// SPLIT CSV BY COLUMN (ACTION)
// File: split-by-column.js
// ===================================

/**
 * Find column index by name (case-insensitive)
 */
function findColumnIndex(headers = [], columnName = "") {
  return headers.findIndex(
    h => h.toLowerCase().trim() === columnName.toLowerCase().trim()
  );
}

/**
 * Split rows by column value
 *
 * NOTE:
 * - Default output = ALL rows (unchanged)
 * - Groups are returned in meta for UI / downloads later
 *
 * @param {Array} headers
 * @param {Array} rows
 * @param {String} columnName
 * @returns {Object}
 */
function splitByColumn(headers, rows, columnName) {
  // 🛡️ Defensive defaults
  if (!Array.isArray(rows)) {
    return {
      headers: headers || [],
      rows: [],
      meta: {
        groups: {},
        column: columnName,
        warning: "Invalid CSV data"
      }
    };
  }

  if (!columnName) {
    return {
      headers,
      rows,
      meta: {
        groups: {},
        warning: "No column name provided"
      }
    };
  }

  const columnIndex = findColumnIndex(headers, columnName);

  // Column not found → SAFE RETURN
  if (columnIndex === -1) {
    return {
      headers,
      rows,
      meta: {
        groups: {},
        warning: `Column "${columnName}" not found`
      }
    };
  }

  const groups = {};

  rows.forEach(row => {
    const value = row[columnIndex];
    const key =
      value && value.toString().trim() !== ""
        ? value.toString().trim()
        : "EMPTY";

    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push(row);
  });

  return {
    headers,
    rows, // IMPORTANT: default output remains unchanged
    meta: {
      column: columnName,
      groupCount: Object.keys(groups).length,
      groups
    }
  };
}

// ===================================
// EXPORT FOR PROMPT ENGINE
// ===================================
window.splitByColumn = splitByColumn;
