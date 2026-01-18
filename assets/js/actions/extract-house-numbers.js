// ===================================
// EXTRACT HOUSE NUMBERS (ACTION)
// ===================================

/**
 * Try to detect a notes-like column
 */
function findNotesColumn(headers) {
  const keywords = ["note", "address", "remark", "description", "comment"];

  return headers.findIndex(h =>
    keywords.some(k => h.toLowerCase().includes(k))
  );
}

/**
 * Extract house number from text
 */
function extractHouseNumber(text) {
  if (!text) return "";

  // Matches numbers like:
  // 123, 12B, 45-47, 8A
  const match = text.match(/\b\d+[a-zA-Z]?(?:-\d+)?\b/);
  return match ? match[0] : "";
}

/**
 * Main action
 *
 * @param {Array} headers
 * @param {Array} rows
 * @returns {Object}
 */
function extractHouseNumbers(headers, rows) {
  const notesIndex = findNotesColumn(headers);

  // If no notes column, return original data unchanged
  if (notesIndex === -1) {
    return {
      headers,
      rows
    };
  }

  const newHeaders = [...headers, "house_number"];

  const newRows = rows.map(row => {
    const notesText = row[notesIndex];
    const houseNumber = extractHouseNumber(notesText);
    return [...row, houseNumber];
  });

  return {
    headers: newHeaders,
    rows: newRows
  };
}

// ===================================
// EXPORT FOR PROMPT ENGINE
// ===================================
window.extractHouseNumbers = extractHouseNumbers;
