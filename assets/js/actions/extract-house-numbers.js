// ===================================
// EXTRACT HOUSE NUMBERS (ACTION)
// ===================================

/**
 * Find possible "notes" columns
 */
function findNotesColumns(headers) {
  const keywords = ["note", "notes", "comment", "comments", "description", "remarks"];

  return headers
    .map((h, i) => ({ name: h.toLowerCase(), index: i }))
    .filter(col => keywords.some(k => col.name.includes(k)))
    .map(col => col.index);
}

/**
 * Extract house number from text
 */
function extractHouseNumber(text) {
  if (!text) return "";

  const match = text.match(/\b\d+[a-zA-Z]?\b|\b\d+-\d+\b/);
  return match ? match[0] : "";
}

/**
 * Main action
 */
function extractHouseNumbers(headers, rows, newColumnName = "House Number") {
  const notesIndexes = findNotesColumns(headers);

  // Add new column
  const updatedHeaders = [...headers, newColumnName];

  const updatedRows = rows.map(row => {
    let houseNumber = "";

    for (const idx of notesIndexes) {
      if (row[idx]) {
        const found = extractHouseNumber(row[idx]);
        if (found) {
          houseNumber = found;
          break;
        }
      }
    }

    return [...row, houseNumber];
  });

  return {
    headers: updatedHeaders,
    rows: updatedRows
  };
}

/**
 * Download helper
 */
function downloadExtractedCSV(headers, rows, filename) {
  const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ===================================
// EXPORT FOR PROMPT ENGINE
// ===================================
window.extractHouseNumbers = extractHouseNumbers;
window.downloadExtractedCSV = downloadExtractedCSV;
