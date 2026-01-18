// ===================================
// EXTRACT HOUSE NUMBERS (ACTION) — SAFE V1
// ===================================

/**
 * Find best guess address column
 */
function findAddressColumnIndex(headers) {
  const candidates = [
    "address",
    "street",
    "street address",
    "property address"
  ];

  return headers.findIndex(h =>
    candidates.includes(h.toLowerCase().trim())
  );
}

/**
 * Extract house number from text
 */
function extractHouseNumber(text) {
  if (!text) return "";

  const match = text.toString().match(/\b\d+[a-zA-Z]?\b/);
  return match ? match[0] : "";
}

/**
 * Extract house numbers into a new column
 *
 * @param {Array} headers
 * @param {Array} rows
 * @returns {Object}
 */
function extractHouseNumbers(headers, rows) {
  const sourceIndex = findAddressColumnIndex(headers);

  // If no address column found, do nothing safely
  if (sourceIndex === -1) {
    return {
      headers,
      rows
    };
  }

  // Prevent duplicate column
  if (headers.map(h => h.toLowerCase()).includes("house number")) {
    return {
      headers,
      rows
    };
  }

  const newHeaders = [...headers, "House Number"];

  const newRows = rows.map(row => {
    const houseNumber = extractHouseNumber(row[sourceIndex]);
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
