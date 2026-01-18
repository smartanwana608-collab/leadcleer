// ======================
// PROMPT ENGINE — CLEAN V1
// ======================

// DOM
const promptInput = document.getElementById("promptInput");
const fileInput = document.getElementById("csvFile");
const runBtn = document.getElementById("runBtn");

const statusBox = document.getElementById("statusBox");
const statusText = document.getElementById("statusText");

const detectedActionsCard = document.getElementById("detectedActionsCard");
const detectedActionsList = document.getElementById("detectedActionsList");

const previewCard = document.getElementById("previewCard");
const csvPreviewTable = document.getElementById("csvPreviewTable");

const resultCard = document.getElementById("resultCard");
const resultSummary = document.getElementById("resultSummary");
const downloadBtn = document.getElementById("downloadResult");

// Data
let headers = [];
let rows = [];
let finalRows = [];

// ======================
// CSV HELPERS
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
// PREVIEW
// ======================
function renderCSVPreview(tableEl, headers, rows, limit = 10) {
  tableEl.innerHTML = "";

  const thead = document.createElement("thead");
  const tr = document.createElement("tr");

  headers.forEach(h => {
    const th = document.createElement("th");
    th.textContent = h;
    tr.appendChild(th);
  });

  thead.appendChild(tr);
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
// PROMPT DETECTOR
// ======================
function detectActions(prompt) {
  const p = prompt.toLowerCase();

  return {
    filterRealEstate: p.includes("real estate"),
    removeMissingEmail: p.includes("missing email"),
    removeDuplicates: p.includes("duplicate"),
    extractHouseNumbers: p.includes("house"),
  };
}

// ======================
// ACTION LIST UI
// ======================
function renderDetectedActions(actions) {
  detectedActionsList.innerHTML = "";

  const map = {
    filterRealEstate: "Filter real estate agents",
    removeMissingEmail: "Remove rows missing email",
    removeDuplicates: "Remove duplicate contacts",
    extractHouseNumbers: "Extract house numbers",
  };

  let found = false;

  Object.keys(actions).forEach(key => {
    if (actions[key]) {
      found = true;
      const li = document.createElement("li");
      li.textContent = map[key];
      detectedActionsList.appendChild(li);
    }
  });

  detectedActionsCard.style.display = found ? "block" : "none";
}

// ======================
// ENABLE RUN BUTTON LOGIC
// ======================
function updateRunButton() {
  runBtn.disabled = !(promptInput.value.trim() && fileInput.files.length);
  runBtn.classList.toggle("enabled", !runBtn.disabled);
}

promptInput.addEventListener("input", () => {
  renderDetectedActions(detectActions(promptInput.value.trim()));
  updateRunButton();
});

fileInput.addEventListener("change", updateRunButton);

// ======================
// RUN PROMPT
// ======================
runBtn.addEventListener("click", () => {
  const prompt = promptInput.value.trim();
  const file = fileInput.files[0];

  if (!prompt || !file) return;

  statusBox.style.display = "block";
  statusText.textContent = "Reading CSV…";

  const reader = new FileReader();
  reader.onload = e => {
    parseCSV(e.target.result);

    previewCard.style.display = "block";
    renderCSVPreview(csvPreviewTable, headers, rows);

    const actions = detectActions(prompt);
    finalRows = [...rows];

    if (actions.filterRealEstate) {
      finalRows = window.filterRealEstateAgents(headers, finalRows).agents;
    }

    if (actions.removeMissingEmail) {
      finalRows = window.removeMissingEmail(headers, finalRows).withEmail;
    }

    if (actions.removeDuplicates) {
      finalRows = window.removeDuplicates(finalRows);
    }

    if (actions.extractHouseNumbers) {
      finalRows = window.extractHouseNumbers(headers, finalRows).rows;
    }

    resultSummary.textContent =
      `Original rows: ${rows.length}\n→ Final rows: ${finalRows.length}`;

    resultCard.style.display = "block";
    statusText.textContent = "Completed";
  };

  reader.readAsText(file);
});

// ======================
// DOWNLOAD
// ======================
downloadBtn.addEventListener("click", () => {
  if (finalRows.length) {
    downloadCSV("processed.csv", headers, finalRows);
  }
});
