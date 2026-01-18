// ===================================
// FILTER REAL ESTATE AGENTS (ACTION) — SAFE V1
// ===================================

/**
 * Default real estate keywords
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
  return headers
    .map((h, i) => ({ name: h.toLowerCase(), index: i }))
    .filter(col => col.name.includes("email"))
    .map(col => col.index);
}

/**
 * Check if row belongs to a real estate agent
 */
function isRealEstateAgent(row, emailIndexes, keywords) {
  return emailIndexes.some(index => {
    const value = row[index];
    if (!value) return false;

    const email = value.toLowerCase();
    return keywords.some(keyword => email.includes(keyword));
  });
}

/**
 * Filter real estate agents from CSV
 *
 * @param {Array} headers
 * @param {Array} rows
 * @param {Array} customKeywords (optional)
 * @returns {Object}
 */
function filterRealEstateAgents(headers, rows, customKeywords = []) {
  const keywords =
    customKeywords.length > 0 ? customKeywords : DEFAULT_RE_KEYWORDS;

  const emailIndexes = findEmailColumns(headers);

  // ✅ SAFE EXIT: no email column
  if (!emailIndexes.length) {
    return {
      headers,
      agents: [],
      nonAgents: rows,
      agentCount: 0,
      nonAgentCount: rows.length
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
    agents,
    nonAgents,
    agentCount: agents.length,
    nonAgentCount: nonAgents.length
  };
}

// ===================================
// EXPORT FOR PROMPT ENGINE
// ===================================
window.filterRealEstateAgents = filterRealEstateAgents;
