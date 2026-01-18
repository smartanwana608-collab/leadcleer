// ===================================
// FIX ADDRESSES (ACTION) — SAFE V1
// ===================================

function fixAddresses(headers, rows, columnName) {
  if (!columnName) {
    return { headers, rows };
  }

  const colIndex = headers.findIndex(
    h => h.toLowerCase() === columnName.toLowerCase()
  );

  if (colIndex === -1) {
    return { headers, rows };
  }

  const fixedRows = rows.map(row => {
    const value = row[colIndex];
    if (!value) return row;

    // Basic cleanup (trim + normalize spaces)
    const fixed = String(value).replace(/\s+/g, " ").trim();
    const newRow = [...row];
    newRow[colIndex] = fixed;
    return newRow;
  });

  return {
    headers,
    rows: fixedRows
  };
}

// EXPORT
window.fixAddresses = fixAddresses;
