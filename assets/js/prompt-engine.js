// ======================
// PROMPT ENGINE — STEP 3 (UX POLISH + FEEDBACK)
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
let actionParams = {};

// ======================
// CSV HELPERS
// ======================
function parseCSV(text) {
  const lines = text.trim().split("\n");
  headers = lines[0].split(",").map(h => h.trim());
  rows = lines.slice(1).map(r => r.split(","));
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
      td.textContent = cell || "";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  tableEl.appendChild(tbody);
}

// ======================
// ACTION DETECTOR (LOCKED)
// ======================
function detectActions(prompt) {
  const p = prompt.toLowerCase();

  return {
    createColumn: p.includes("create"),
    extractHouseNumbers: p.includes("house"),
    filterRealEstate: p.includes("real estate"),
    fixAddresses: p.includes("fix address"),
    removeMissingEmail: p.includes("remove") && p.includes("missing email"),
    removeDuplicates: p.includes("duplicate"),
    splitByColumn: p.includes("split"),
  };
}

// ======================
// DETECTED ACTIONS UI
// ======================
function renderDetectedActions(actions) {
  detectedActionsList.innerHTML = "";
  let found = false;

  const labels = {
    createColumn: "Create a new column",
    extractHouseNumbers: "Extract house numbers",
    filterRealEstate: "Filter real estate agents",
    fixAddresses: "Fix addresses",
    removeMissingEmail: "Remove rows missing email",
    removeDuplicates: "Remove duplicate contacts",
    splitByColumn: "Split CSV by column",
  };

  Object.keys(actions).forEach(key => {
    if (actions[key]) {
      found = true;
      const li = document.createElement("li");
      li.textContent = labels[key];
      detectedActionsList.appendChild(li);
    }
  });

  detectedActionsCard.style.display = found ? "block" : "none";
  return found;
}

// ======================
// SMART ACTION PARAMETERS UI
// ======================
function renderActionParams(actions) {
  actionParamsFields.innerHTML = "";
  actionParams = {};

  // CREATE COLUMN
  if (actions.createColumn) {
    const label = document.createElement("label");
    label.textContent = "New column name";

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "e.g. Lead Source";
    input.style.width = "100%";
    input.style.padding = "10px";

    input.addEventListener("input", () => {
      actionParams.columnName = input.value.trim();
      updateRunButton();
    });

    actionParamsFields.appendChild(label);
    actionParamsFields.appendChild(input);
    actionParamsCard.style.display = "block";
    return;
  }

  // COLUMN SELECTOR
  if (
    actions.splitByColumn ||
    actions.extractHouseNumbers ||
    actions.fixAddresses
  ) {
    const label = document.createElement("label");
    label.textContent = "Select column";

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
      actionParams.column = select.value;
      updateRunButton();
    });

    actionParamsFields.appendChild(label);
    actionParamsFields.appendChild(select);
    actionParamsCard.style.display = "block";
    return;
  }

  actionParamsCard.style.display = "none";
}

// ======================
// RUN BUTTON VALIDATION
// ======================
function updateRunButton() {
  const hasPrompt = promptInput.value.trim();
  const hasFile = fileInput.files.length;
  const actions = detectActions(promptInput.value.trim());

  const needsColumnName = actions.createColumn && !actionParams.columnName;
  const needsColumn =
    (actions.splitByColumn ||
      actions.extractHouseNumbers ||
      actions.fixAddresses) &&
    !actionParams.column;

  runBtn.disabled = !(hasPrompt && hasFile) || needsColumnName || needsColumn;
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
// RUN PROMPT (UX POLISHED)
// ======================
runBtn.addEventListener("click", () => {
  statusBox.style.display = "block";
  statusText.textContent = "Reading CSV…";
  progressBar.style.width = "20%";
  progressPercent.textContent = "20%";

  const reader = new FileReader();

  reader.onload = e => {
    parseCSV(e.target.result);

    statusText.textContent = "Applying selected actions…";
    progressBar.style.width = "50%";
    progressPercent.textContent = "50%";

    renderCSVPreview(csvPreviewTable, headers, rows);
    previewCard.style.display = "block";

    finalRows = [...rows];
    const actions = detectActions(promptInput.value.trim());

    try {
      if (actions.createColumn) {
        const r = window.createNewColumn(headers, finalRows);
        headers = r.headers;
        finalRows = r.rows;
      }

      if (actions.extractHouseNumbers) {
        const r = window.extractHouseNumbers(headers, finalRows);
        headers = r.headers;
        finalRows = r.rows;
      }

      if (actions.fixAddresses) {
        const r = window.fixAddresses(headers, finalRows, actionParams.column);
        headers = r.headers;
        finalRows = r.rows;
      }

      if (actions.filterRealEstate) {
        finalRows = window.filterRealEstateAgents(headers, finalRows).agents;
      }

      if (actions.removeMissingEmail) {
        finalRows = window.removeMissingEmail(headers, finalRows).withEmail;
      }

      if (actions.removeDuplicates) {
        finalRows = window.removeDuplicates(headers, finalRows).rows;
      }

      statusText.textContent = "Finalizing output…";
      progressBar.style.width = "100%";
      progressPercent.textContent = "100%";

      resultSummary.textContent =
        `Columns: ${headers.length}\n` +
        `Original rows: ${rows.length}\n` +
        `Final rows: ${finalRows.length}`;

      resultCard.style.display = "block";
      downloadBtn.disabled = false;
      downloadBtn.classList.add("enabled");
      statusText.textContent = "Completed ✅";
    } catch (err) {
      alert(err.message || "Action failed on this CSV.");
    }
  };

  reader.readAsText(fileInput.files[0]);
});

// ======================
// DOWNLOAD
// ======================
downloadBtn.addEventListener("click", () => {
  if (!finalRows.length) return;

  const csv = [headers, ...finalRows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "processed.csv";
  a.click();
  URL.revokeObjectURL(url);
});
