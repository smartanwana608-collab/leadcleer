// ======================
// PROMPT ENGINE — FINAL V7 (SPLIT → MULTI DOWNLOAD)
// ======================

// DOM
const promptInput = document.getElementById("promptInput");
const fileInput = document.getElementById("csvFile");
const runBtn = document.getElementById("runBtn");

const statusBox = document.getElementById("statusBox");
const statusText = document.getElementById("statusText");

const detectedActionsCard = document.getElementById("detectedActionsCard");
const detectedActionsList = document.getElementById("detectedActionsList");

const actionParamsCard = document.getElementById("actionParamsCard");
const actionParamsFields = document.getElementById("actionParamsFields");

const previewCard = document.getElementById("previewCard");
const csvPreviewTable = document.getElementById("csvPreviewTable");

const resultCard = document.getElementById("resultCard");
const resultSummary = document.getElementById("resultSummary");
const downloadBtn = document.getElementById("downloadResult");

const progressBar = document.getElementById("progressBar");
const progressPercent = document.getElementById("progressPercent");

// Data
let headers = [];
let rows = [];
let finalRows = [];
let splitGroups = null;
let actionParams = {};

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
    splitByColumn: p.includes("split"),
  };
}

// ======================
// ACTION LIST UI
// ======================
function renderDetectedActions(actions) {
  detectedActionsList.innerHTML = "";

  if (actions.splitByColumn) {
    const li = document.createElement("li");
    li.textContent = "Split CSV by column";
    detectedActionsList.appendChild(li);
    detectedActionsCard.style.display = "block";
  } else {
    detectedActionsCard.style.display = "none";
  }
}

// ======================
// ACTION PARAMETERS UI
// ======================
function renderActionParams(actions) {
  actionParamsFields.innerHTML = "";
  actionParams = {};

  if (!actions.splitByColumn) {
    actionParamsCard.style.display = "none";
    return;
  }

  const label = document.createElement("label");
  label.textContent = "Select column to split by:";

  const select = document.createElement("select");
  select.style.width = "100%";
  select.style.padding = "10px";

  headers.forEach(h => {
    const opt = document.createElement("option");
    opt.value = h;
    opt.textContent = h;
    select.appendChild(opt);
  });

  select.addEventListener("change", () => {
    actionParams.splitColumn = select.value;
    updateRunButton();
  });

  actionParamsFields.appendChild(label);
  actionParamsFields.appendChild(select);
  actionParamsCard.style.display = "block";
}

// ======================
// ENABLE RUN BUTTON
// ======================
function updateRunButton() {
  const hasPrompt = promptInput.value.trim();
  const hasFile = fileInput.files.length;
  const needsColumn = detectActions(promptInput.value.trim()).splitByColumn &&
                      !actionParams.splitColumn;

  runBtn.disabled = !(hasPrompt && hasFile) || needsColumn;
  runBtn.classList.toggle("enabled", !runBtn.disabled);
}

// ======================
// EVENTS
// ======================
promptInput.addEventListener("input", () => {
  const actions = detectActions(promptInput.value.trim());
  renderDetectedActions(actions);
  renderActionParams(actions);
  updateRunButton();
});

fileInput.addEventListener("change", updateRunButton);

// ======================
// RUN PROMPT
// ======================
runBtn.addEventListener("click", () => {
  statusBox.style.display = "block";
  statusText.textContent = "Splitting CSV…";
  progressBar.style.width = "30%";
  progressPercent.textContent = "30%";

  const reader = new FileReader();

  reader.onload = e => {
    parseCSV(e.target.result);

    previewCard.style.display = "block";
    renderCSVPreview(csvPreviewTable, headers, rows);

    const result = window.splitByColumn(
      headers,
      rows,
      actionParams.splitColumn
    );

    splitGroups = result.groups;

    const groupCount = Object.keys(splitGroups).length;

    progressBar.style.width = "100%";
    progressPercent.textContent = "100%";

    resultSummary.textContent =
      `Split column: ${actionParams.splitColumn}\n` +
      `Total rows: ${rows.length}\n` +
      `Groups created: ${groupCount}`;

    downloadBtn.disabled = false;
    downloadBtn.textContent = "Download All Split CSVs";
    resultCard.style.display = "block";
    statusText.textContent = "Completed";
  };

  reader.readAsText(fileInput.files[0]);
});

// ======================
// DOWNLOAD (MULTI FILE)
// ======================
downloadBtn.addEventListener("click", () => {
  if (!splitGroups) return;

  Object.keys(splitGroups).forEach(key => {
    const safeKey = key.replace(/[^a-z0-9]/gi, "_") || "EMPTY";
    const filename =
      `split-${actionParams.splitColumn}-${safeKey}.csv`;

    downloadCSV(filename, headers, splitGroups[key]);
  });
});
