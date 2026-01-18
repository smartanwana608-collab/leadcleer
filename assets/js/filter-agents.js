// ======================
// KEYWORD STORAGE
// ======================
const STORAGE_KEY = "csv_agent_keywords";

let keywords = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [
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
function saveKeywords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keywords));
}

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
// PREVIEW RENDERER
// ======================
function renderPreview(tableEl, headers, rows, limit = 10) {
  tableEl.innerHTML = "";

  if (!rows.length) {
    tableEl.innerHTML = "<tr><td>No data</td></tr>";
    return;
  }

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");

  headers.forEach(h => {
    const th = document.createElement("th");
    th.textContent = h;
    headRow.appendChild(th);
  });

  thead.appendChild(headRow);
  tableEl.appendChild(thead);

  const tbody = document.createElement("tbody");

  rows.slice(0, limit).forEach(row => {
    const tr = document.createElement("tr");
    row.forEach(cell => {
      const td = document.createElement("td");
      td.textContent = cell;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  tableEl.appendChild(tbody);
}

// ======================
// MAIN
// ======================
document.addEventListener("DOMContentLoaded", () => {
  // File + buttons
  const fileInput = document.getElementById("csvFile");
  const analyzeBtn = document.getElementById("analyzeBtn");

  // Info
  const fileNameEl = document.getElementById("fileName");
  const rowCountEl = document.getElementById("rowCount");
  const columnCountEl = document.getElementById("columnCount");

  // Results
  const agentCountEl = document.getElementById("agentCount");
  const otherCountEl = document.getElementById("otherCount");

  // Downloads
  const downloadAgentsBtn = document.getElementById("downloadAgents");
  const downloadOthersBtn = document.getElementById("downloadOthers");

  // Preview tables
  const agentsPreviewTable = document.getElementById("agentsPreview");
  const othersPreviewTable = document.getElementById("othersPreview");

  // Keyword UI
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

    keywordListEl.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        const index = Number(btn.dataset.index);
        keywords.splice(index, 1);
        saveKeywords();
        renderKeywords();
      });
    });
  }

  addKeywordBtn.addEventListener("click", () => {
    const value = newKeywordInput.value.trim().toLowerCase();
    if (!value || keywords.includes(value)) return;

    keywords.push(value);
    saveKeywords();
    newKeywordInput.value = "";
    renderKeywords();
  });

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
  });

  // ======================
  // ANALYZE CSV
  // ======================
  analyzeBtn.addEventListener("click", () => {
    const file = fileInput.files[0];
    if (!file) return;

    analyzeBtn.textContent = "Analyzing…";
    analyzeBtn.disabled = true;

    const reader = new FileReader();
    reader.onload = e => {
      const rows = e.target.result.trim().split("\n").map(r => r.split(","));

      headers = rows[0];
      parsedRows = rows.slice(1);

      rowCountEl.textContent = `Total rows: ${parsedRows.length}`;
      columnCountEl.textContent = `Detected columns: ${headers.length}`;

      const emailIndexes = headers
        .map((h, i) => ({ h: h.toLowerCase(), i }))
        .filter(col => col.h.includes("email"))
        .map(col => col.i);

      agents = [];
      nonAgents = [];

      parsedRows.forEach(row => {
        isRealEstateAgent(row, emailIndexes)
          ? agents.push(row)
          : nonAgents.push(row);
      });

      agentCountEl.textContent = agents.length;
      otherCountEl.textContent = nonAgents.length;

      // Render previews
      renderPreview(agentsPreviewTable, headers, agents);
      renderPreview(othersPreviewTable, headers, nonAgents);

      // Enable downloads
      downloadAgentsBtn.classList.add("enabled");
      downloadOthersBtn.classList.add("enabled");

      analyzeBtn.textContent = "Analysis Complete";
    };

    reader.readAsText(file);
  });

  // ======================
  // DOWNLOADS
  // ======================
  downloadAgentsBtn.addEventListener("click", () => {
    if (agents.length) {
      downloadCSV("real_estate_agents.csv", headers, agents);
    }
  });

  downloadOthersBtn.addEventListener("click", () => {
    if (nonAgents.length) {
      downloadCSV("other_contacts.csv", headers, nonAgents);
    }
  });
});
