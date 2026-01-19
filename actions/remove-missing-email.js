export function removeMissingEmails({ headers, rows }) {
  const emailIndex = headers.findIndex(h =>
    h.toLowerCase().includes("email")
  );

  if (emailIndex === -1) {
    return {
      success: false,
      message: "No email column found in this CSV.",
      headers,
      rows
    };
  }

  const cleaned = [];
  const removed = [];

  rows.forEach(row => {
    const email = (row[emailIndex] || "").toString().trim();

    if (!email || !email.includes("@")) {
      removed.push(row);
    } else {
      cleaned.push(row);
    }
  });

  return {
    success: true,
    action: "remove-missing-emails",
    headers,
    rows: cleaned,
    meta: {
      removedCount: removed.length,
      remainingCount: cleaned.length
    }
  };
}
