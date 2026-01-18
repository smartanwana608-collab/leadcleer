// ===================================
// REMOVE ROWS MISSING EMAIL (ACTION)
// File: remove-missing-email.js
// ===================================

/**
 * Find all email column indexes
 */
function findEmailColumns(headers = []) {
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
  // 🛡️ Defensive defaults
  if (!Array.isArray(rows)) {
    return {
      headers: headers || [],
      rows: [],
      meta: {
        kept: 0,
        removed: 0,
        emailColumns: 0
      }
    };
  }

  const emailIndexes = findEmailColumns(headers);

  // If no email column → return original rows safely
  if (!emailIndexes.length) {
    return {
      headers,
      rows,
      meta: {
        kept: rows.length,
        removed: 0,
        emailColumns: 0,
        warning: "No email column found"
      }
    };
  }

  const kept = [];
  let removedCount = 0;

  rows.forEach(row => {
    if (rowHasEmail(row, emailIndexes)) {
      kept.push(row);
    } else {
      removedCount++;
    }
  });

  return {
    headers,
    rows: kept,
    meta: {
      kept: kept.length,
      removed: removedCount,
      emailColumns: emailIndexes.length
    }
  };
}

// ===================================
// EXPORT FOR PROMPT ENGINE
// ===================================
window.removeMissingEmail = removeMissingEmail;
