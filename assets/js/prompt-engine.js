// ======================
// PROMPT ENGINE — FINAL V1
// ======================

// ======================
// DOM REFERENCES
// ======================
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

// ======================
// DATA
// ======================
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
// CSV PREVIEW
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
// PROMPT → ACTION PARSER (WITH PARAMETERS)
// ======================
function detectActions(prompt) {
  const p = prompt.toLowerCase();

  const splitMatch = p.match(/split (csv )?by column ([a-z0-9 _-]+)/i);
  const extractHouseMatch = p.match(/extract house numbers from ([a-z0-9 _-]+)/i);
  const createColumnMatch = p.match(/create (a )?new column ([a-z0-9 _-]+)/i);

  return {
    filterRealEstate: p.includes("real estate"),
    removeMissingEmail: p.includes("missing email"),
    removeDuplicates: p.includes("duplicate"),

    splitByColumn: splitMatch ? splitMatch[2].trim() : null,
    extractHouseNumbers: extractHouseMatch ? extractHouseMatch[1].trim() : null,
    createNewColumn: createColumnMatch ? createColumnMatch[2].trim() : null
  };
}

// ======================
// DETECTED ACTIONS UI
// ======================
function renderDetectedActions(actions) {
  detectedActionsList.innerHTML = "";

  const map = {
    filterRealEstate: () => "Filter real estate agents",
    removeMissingEmail: () => "Remove rows missing email",
    removeDuplicates: () => "Remove duplicate contacts",
    splitByColumn: col => `Split CSV by column "${col}"`,
    extractHouseNumbers: col => `Extract house numbers from "${col}"`,
    createNewColumn: col => `Create new column "${col}"`
  };

  let found = false;

  Object.keys(actions).forEach(key => {
    if (actions[key]) {
      found = true;
      const li = document.createElement("li");
      li.textContent = map[key](actions[key]);
      detectedActionsList.appendChild(li);
    }
  });

  detectedActionsCard.style.display = found ? "block" : "none";
  return found;
}

// ======================
// ENABLE RUN BUTTON
// ======================
function updateRunButton() {
  runBtn.disabled = !(promptInput.value.trim() && fileInput.files.length);
  runBtn.classList.toggle("enabled", !runBtn.disabled);
}

promptInput.addEventListener("input", () => {
  const actions = detectActions(promptInput.value.trim());
  renderDetectedActions(actions);
  updateRunButton();
});

fileInput.addEventListener("change", updateRunButton);

// ======================
// RUN PROMPT
// ======================
runBtn.addEventListener("click", () => {
  const prompt = promptInput.value.trim();
  const file = fileInput.files[0];

  if (!prompt) {
    alert("Please enter a prompt first.");
    return;
  }

  if (!file) {
    alert("Please upload a CSV file.");
    return;
  }

  const actions = detectActions(prompt);
  const hasAction = renderDetectedActions(actions);

  if (!hasAction) {
    alert("No valid action detected. Please use supported action wording.");
    return;
  }

  statusBox.style.display = "block";
  statusText.textContent = "Reading CSV…";

  const reader = new FileReader();
  reader.onload = e => {
    parseCSV(e.target.result);

    // Preview original CSV
    previewCard.style.display = "block";
    renderCSVPreview(csvPreviewTable, headers, rows);

    statusText.textContent = "Applying selected actions…";

    finalRows = [...rows];

    // ======================
    // APPLY ACTIONS (ORDERED)
    // ======================
    if (actions.filterRealEstate) {
      const result = window.filterRealEstateAgents(headers, finalRows);
      finalRows = result.agents;
    }

    if (actions.removeMissingEmail) {
      const result = window.removeMissingEmail(headers, finalRows);
      finalRows = result.withEmail;
    }

    if (actions.removeDuplicates) {
      const result = window.removeDuplicates(headers, finalRows);
      finalRows = result.rows;
    }

    if (actions.extractHouseNumbers) {
      const result = window.extractHouseNumbers(
        headers,
        finalRows,
        actions.extractHouseNumbers
      );
      headers = result.headers;
      finalRows = result.rows;
    }

    if (actions.createNewColumn) {
      const result = window.createNewColumn(
        headers,
        finalRows,
        actions.createNewColumn
      );
      headers = result.headers;
      finalRows = result.rows;
    }

    // ======================
    // RESULTS
    // ======================
    resultSummary.textContent =
      `Columns: ${headers.length}\n` +
      `Original rows: ${rows.length}\n` +
      `Final rows: ${finalRows.length}`;

    resultCard.style.display = "block";
    statusText.textContent = "Completed";
  };

  reader.readAsText(file);
});

// ======================
// DOWNLOAD
// ======================
downloadBtn.addEventListener("click", () => {
  if (!finalRows.length) {
    alert("Nothing to download.");
    return;
  }
  downloadCSV("processed.csv", headers, finalRows);
});
