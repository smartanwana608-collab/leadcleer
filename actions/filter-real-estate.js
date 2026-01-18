// ===================================
// FILTER REAL ESTATE AGENTS (ACTION) — SAFE V2 (ENGINE-COMPATIBLE)
// ===================================

/**
 * Default real estate keywords
 * (Peter-approved set)
 */
const DEFAULT_RE_KEYWORDS = [
  "realtor",
  "realty",
  "broker",
  "brokerage",
  "kw",
  "coldwell",
  "century",
  "sotheby",
  "property",
  "estate"
];

/**
 * Find email column indexes automatically
 */
function findEmailColumns(headers) {
  if (!Array.isArray(headers)) return [];

  return headers
    .map((h, i) => ({
      name: String(h || "").toLowerCase(),
      index: i
    }))
    .filter(col => col.name.includes("email"))
    .map(col => col.index);
}

/**
 * Check if row belongs to a real estate agent
 */
function isRealEstateAgent(row, emailIndexes, keywords) {
  if (!Array.isArray(row)) return false;

  return emailIndexes.some(index => {
    const value = row[index];
    if (!value) return false;

    const email = String(value).toLowerCase();
    return keywords.some(keyword => email.includes(keyword));
  });
}

/**
 * Filter real estate agents from CSV
 *
 * ALWAYS returns { headers, rows, meta }
 */
function filterRealEstateAgents(headers = [], rows = [], customKeywords = []) {
  const keywords =
    Array.isArray(customKeywords) && customKeywords.length
      ? customKeywords
      : DEFAULT_RE_KEYWORDS;

  const emailIndexes = findEmailColumns(headers);

  // 🟡 NO EMAIL COLUMN → SAFE NO-OP WITH MESSAGE
  if (!emailIndexes.length) {
    return {
      headers,
      rows, // ← IMPORTANT: return original rows untouched
      meta: {
        warning:
          "This CSV does not contain an email column. Real estate filtering was skipped.",
        agentCount: 0,
        nonAgentCount: rows.length
      }
    };
  }

  const agents = [];
  const nonAgents = [];

  rows.forEach(row => {
    isRealEstateAgent(row, emailIndexes, keywords)
      ? agents.push(row)
      : nonAgents.push(row);
  });

  return {
    headers,
    rows: agents, // ← ENGINE EXPECTS rows HERE
    meta: {
      agentCount: agents.length,
      nonAgentCount: nonAgents.length
    }
  };
}

// ===================================
// EXPORT FOR PROMPT ENGINE
// ===================================
window.filterRealEstateAgents = filterRealEstateAgents;
