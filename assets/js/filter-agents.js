// ======================
// KEYWORDS (Editable)
// ======================
let keywords = [
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

// ======================
// HELPERS
// ======================
function isAgentEmail(email) {
  if (!email) return false;
  const lower = email.toLowerCase();
  return keywords.some(keyword => lower.includes(keyword));
}

function isRealEstateAgent(row, emailIndexes) {
  return emailIndexes.some(index => {
    const value = row[index];
    return isAgentEmail(value);
  });
}

function downloadCSV(filename, headers, rows) {
  const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ======================
// MAIN
// ======================
document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.querySelector('input[type="file"]');
  const analyzeBtn = document.querySelector(".btn");

  const fileNameEl = document.getElementById("fileName");
  const rowCountEl = document.getElementById("rowCount");
  const columnCountEl = document.getElementById("columnCount");

  const agentCountEl = document.getElementById("agentCount");
  const otherCountEl = document.getElementById("otherCount");

  const downloadAgentsBtn = document.getElementById("downloadAgents");
  const downloadOthersBtn = document.getElementById("downloadOthers");

  // Keyword UI elements
  const keywordListEl = document.getElementById("keywordList");
  const newKeywordInput = document.getElementById("newKeyword");
  const addKeywordBtn = document.getElementById("addKeywordBtn");

  let headers = [];
  let parsedRows = [];
  let agents = [];
  let nonAgents = [];

  // ======================
  // KEYWORD UI
  // ======================
  function renderKeywords() {
    if (!keywordListEl) return;

    keywordListEl.innerHTML = "";
    keywords.forEach((kw, index) => {
      const tag = document.createElement("div");
      tag.className = "keyword";
      tag.innerHTML = `
        ${kw}
        <button type="button" data-index="${index}">×</button>
      `;
      keywordListEl.appendChild(tag);
    });

    // Remove keyword handler
    keywordListEl.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        const index = parseInt(btn.dataset.index);
        keywords.splice(index, 1);
        renderKeywords();
      });
    });
  }

  if (addKeywordBtn) {
    addKeywordBtn.addEventListener("click", () => {
      const value = newKeywordInput.value.trim().toLowerCase();
      if (!value || keywords.includes(value)) return;

      keywords.push(value);
      newKeywordInput.value = "";
      renderKeywords();
    });
  }

  renderKeywords();

  // ======================
  // FILE UPLOAD
  // ======================
  fileInput.addEventListener("change", () => {
    if (!fileInput.files.length) return;

    const file = fileInput.files[0];
    fileNameEl.textContent = `File name: ${file.name}`;

    analyzeBtn.classList.add("enabled");
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = "Analyze CSV";
    analyzeBtn.style.opacity = "1";
    analyzeBtn.style.cursor = "pointer";
  });

  // ======================
  // ANALYZE CSV
  // ======================
  analyzeBtn.addEventListener("click", () => {
    const file = fileInput.files[0];
    if (!file) return;

    analyzeBtn.textContent = "Analyzing…";
    analyzeBtn.disabled = true;
    analyzeBtn.style.opacity = "0.6";

    const reader = new FileReader();

    reader.onload = e => {
      const text = e.target.result;
      const rows = text.trim().split("\n").map(r => r.split(","));

      headers = rows[0];
      parsedRows = rows.slice(1);

      rowCountEl.textContent = `Total rows: ${parsedRows.length}`;
      columnCountEl.textContent = `Detected columns: ${headers.length}`;

      // Detect email columns
      const emailIndexes = headers
        .map((h, i) => ({ name: h.toLowerCase(), index: i }))
        .filter(col => col.name.includes("email"))
        .map(col => col.index);

      agents = [];
      nonAgents = [];

      parsedRows.forEach(row => {
        if (isRealEstateAgent(row, emailIndexes)) {
          agents.push(row);
        } else {
          nonAgents.push(row);
        }
      });

      agentCountEl.textContent = agents.length;
      otherCountEl.textContent = nonAgents.length;

      downloadAgentsBtn.classList.add("enabled");
      downloadAgentsBtn.disabled = false;

      downloadOthersBtn.classList.add("enabled");
      downloadOthersBtn.disabled = false;

      analyzeBtn.textContent = "Analysis Complete";
    };

    reader.readAsText(file);
  });

  // ======================
  // DOWNLOADS
  // ======================
  downloadAgentsBtn.addEventListener("click", () => {
    if (!agents.length) return;
    downloadCSV("real_estate_agents.csv", headers, agents);
  });

  downloadOthersBtn.addEventListener("click", () => {
    if (!nonAgents.length) return;
    downloadCSV("other_contacts.csv", headers, nonAgents);
  });
});
