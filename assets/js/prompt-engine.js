// ======================
// PROMPT ENGINE (V1)
// ======================

// DOM
const promptInput = document.getElementById("promptInput");
const fileInput = document.getElementById("csvFile");
const runBtn = document.getElementById("runBtn");

const statusBox = document.getElementById("statusBox");
const statusText = document.getElementById("statusText");

const resultCard = document.getElementById("resultCard");
const resultSummary = document.getElementById("resultSummary");
const downloadBtn = document.getElementById("downloadResult");

// Detected actions UI
const detectedActionsCard = document.getElementById("detectedActionsCard");
const detectedActionsList = document.getElementById("detectedActionsList");

// Preview UI ✅
const previewCard = document.getElementById("previewCard");
const csvPreviewTable = document.getElementById("csvPreviewTable");

// Data
let headers = [];
let rows = [];
let resultRows = [];

// ======================
// HELPERS
// ======================
function parseCSV(text) {
  const lines = text.trim().split("\n");
  headers = lines[0].split(",");
  rows = lines.slice(1).map(r => r.split(","));
}

function downloadCSV(filename, headers, rows) {
  const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ======================
// CSV PREVIEW RENDERER ✅
// ======================
function renderCSVPreview(tableEl, headers, rows, limit = 10) {
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
// PROMPT INTENT PARSER
// ======================
function detectActions(prompt) {
  const p = prompt.toLowerCase();

  return {
    removeMissingEmail: p.includes("missing email"),
    removeDuplicates: p.includes("duplicate"),
    splitByColumn: p.includes("split"),
    extractHouseNumber: p.includes("house"),
    fixAddress: p.includes("address"),
  };
}

// ======================
// DETECTED ACTIONS RENDER
// ======================
function renderDetectedActions(actions) {
  detectedActionsList.innerHTML = "";

  const actionMap = {
    removeMissingEmail: "Remove rows missing email",
    removeDuplicates: "Remove duplicates",
    splitByColumn: "Split CSV by column",
    extractHouseNumber: "Extract house numbers",
    fixAddress: "Fix addresses",
  };

  let found = false;

  Object.keys(actions).forEach(key => {
    if (actions[key]) {
      found = true;
      const li = document.createElement("li");
      li.textContent = actionMap[key];
      detectedActionsList.appendChild(li);
    }
  });

  detectedActionsCard.style.display = found ? "block" : "none";
}

// ======================
// LIVE PROMPT LISTENER
// ======================
promptInput.addEventListener("input", () => {
  const prompt = promptInput.value.trim();
  if (!prompt) {
    detectedActionsCard.style.display = "none";
    return;
  }

  const actions = detectActions(prompt);
  renderDetectedActions(actions);
});

// ======================
// BASIC ACTIONS (TEMP — WILL MOVE TO /actions)
// ======================
function removeRowsMissingEmail(data) {
  const emailIndex = headers.findIndex(h =>
    h.toLowerCase().includes("email")
  );
  if (emailIndex === -1) return data;
  return data.filter(r => r[emailIndex]?.trim());
}

function removeDuplicates(data) {
  const seen = new Set();
  return data.filter(row => {
    const key = row.join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ======================
// RUN PROMPT
// ======================
runBtn.addEventListener("click", () => {
  const prompt = promptInput.value.trim();
  const file = fileInput.files[0];

  if (!prompt || !file) {
    alert("Please enter a prompt and upload a CSV file.");
    return;
  }

  statusBox.style.display = "block";
  statusText.textContent = "Reading CSV…";

  const reader = new FileReader();
  reader.onload = e => {
    // Parse CSV
    parseCSV(e.target.result);

    // ✅ SHOW PREVIEW IMMEDIATELY
    renderCSVPreview(csvPreviewTable, headers, rows);
    previewCard.style.display = "block";

    const actions = detectActions(prompt);
    renderDetectedActions(actions);

    resultRows = [...rows];

    if (actions.removeMissingEmail) {
      resultRows = removeRowsMissingEmail(resultRows);
    }

    if (actions.removeDuplicates) {
      resultRows = removeDuplicates(resultRows);
    }

    resultSummary.textContent =
      `Original rows: ${rows.length}\n→ Final rows: ${resultRows.length}`;

    resultCard.style.display = "block";
    statusText.textContent = "Completed";
  };

  reader.readAsText(file);
});

// ======================
// DOWNLOAD
// ======================
downloadBtn.addEventListener("click", () => {
  if (resultRows.length) {
    downloadCSV("processed.csv", headers, resultRows);
  }
});
