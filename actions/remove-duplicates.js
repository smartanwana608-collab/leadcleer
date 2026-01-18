// ===================================
// REMOVE DUPLICATES (ACTION) — SAFE V1
// File: remove-duplicates.js
// ===================================

/**
 * Remove duplicate rows from CSV
 * Duplicate = rows with identical values across all columns
 *
 * @param {Array} headers
 * @param {Array} rows
 * @returns {Object}
 */
function removeDuplicates(headers, rows) {
  // 🛡️ Defensive defaults
  if (!Array.isArray(rows)) {
    return {
      headers: headers || [],
      rows: [],
      removedCount: 0
    };
  }

  const seen = new Set();
  const uniqueRows = [];
  let removedCount = 0;

  rows.forEach(row => {
    const key = row.join("||");

    if (seen.has(key)) {
      removedCount++;
    } else {
      seen.add(key);
      uniqueRows.push(row);
    }
  });

  return {
    headers: headers || [],
    rows: uniqueRows,
    removedCount
  };
}

// ===================================
// EXPORT FOR PROMPT ENGINE
// ===================================
window.removeDuplicates = removeDuplicates;
