// ===================================
// ACTION: FIND CONTACTS MISSING EMAIL
// File: missing-email.js
// ===================================

/**
 * Detect email-related columns
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
function hasEmail(row, emailIndexes) {
  return emailIndexes.some(
    idx => row[idx] && row[idx].trim() !== ""
  );
}

/**
 * Core logic:
 * Split contacts into
 * - missing email
 * - has email
 */
function findContactsMissingEmail(headers, rows) {
  const emailIndexes = findEmailColumns(headers);

  const missingEmailRows = [];
  const hasEmailRows = [];

  rows.forEach(row => {
    hasEmail(row, emailIndexes)
      ? hasEmailRows.push(row)
      : missingEmailRows.push(row);
  });

  return {
    headers,
    missingEmailRows,
    hasEmailRows,
    emailColumnCount: emailIndexes.length
  };
}

/**
 * CSV download helper
 */
function downloadMissingEmailCSV(headers, rows, filename) {
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
// EXPORT (for Prompt Tool / UI)
// ===================================
window.findContactsMissingEmail = findContactsMissingEmail;
window.downloadMissingEmailCSV = downloadMissingEmailCSV;
