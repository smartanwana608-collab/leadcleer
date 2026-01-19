// actions/filter-real-estate.js

const KEYWORDS = [
  "remax",
  "sutton",
  "rlp",
  "c21",
  "real",
  "realty",
  "exp",
  "agent",
  "home",
  "homes",
  "broker",
  "brokerage",
  "kw",
  "coldwell",
  "century"
];

function normalize(value) {
  return (value || "").toString().toLowerCase();
}

function rowText(row) {
  return Object.values(row)
    .map(normalize)
    .join(" ");
}

export function filterRealEstate(rows) {
  const agents = [];
  const possibleAgents = [];
  const others = [];

  rows.forEach(row => {
    let score = 0;
    const text = rowText(row);

    KEYWORDS.forEach(keyword => {
      if (text.includes(keyword)) score++;
    });

    if (score >= 3) {
      agents.push(row);
    } else if (score === 2) {
      possibleAgents.push(row);
    } else {
      others.push(row);
    }
  });

  return {
    title: "Filter Real Estate Agents",
    summary: `Detected ${agents.length} agents, ${possibleAgents.length} possible agents, and ${others.length} other contacts.`,
    preview: {
      agents: agents.slice(0, 5),
      possibleAgents: possibleAgents.slice(0, 5),
      others: others.slice(0, 5)
    },
    downloads: {
      agents,
      possibleAgents,
      others
    }
  };
}
