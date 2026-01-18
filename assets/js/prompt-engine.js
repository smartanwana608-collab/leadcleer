// ======================
// PROMPT ENGINE — STABLE V2
// ======================

// ---------- DOM ----------
const promptInput = document.getElementById("promptInput");
const fileInput = document.getElementById("csvFile");
const runBtn = document.getElementById("runBtn");

const statusBox = document.getElementById("statusBox");
const statusText = document.getElementById("statusText");
const progressBar = document.getElementById("progressBar");
const progressPercent = document.getElementById("progressPercent");

const detectedActionsCard = document.getElementById("detectedActionsCard");
const detectedActionsList = document.getElementById("detectedActionsList");

const actionParamsCard = document.getElementById("actionParamsCard");
const actionParamsFields = document.getElementById("actionParamsFields");

const previewCard = document.getElementById("previewCard");
const csvPreviewTable = document.getElementById("csvPreviewTable");

const resultCard = document.getElementById("resultCard");
const resultSummary = document.getElementById("resultSummary");
const downloadBtn = document.getElementById("downloadResult");

// ---------- DATA ----------
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
// PROMPT DETECTION
// ======================
function detectActions(prompt) {
  const p = prompt.toLowerCase();

  return {
    filterRealEstate: p.includes("real estate"),
    removeMissingEmail: p.includes("missing email"),
    removeDuplicates: p.includes("duplicate"),
    extractHouseNumbers: p.includes("house"),
    createColumn: p.includes("new column")
  };
}

// ======================
// DETECTED ACTIONS UI
// ======================
function renderDetectedActions(actions) {
  detectedActionsList.innerHTML = "";

  const labels = {
    filterRealEstate: "Filter real estate agents",
    removeMissingEmail: "Remove rows missing email",
    removeDuplicates: "Remove duplicate contacts",
    extractHouseNumbers: "Extract house numbers",
    createColumn: "Create a new column"
  };

  let found = false;

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
// ACTION PARAMETERS UI
// ======================
function renderActionParameters(actions) {
  actionParamsFields.innerHTML = "";
  actionParamsCard.style.display = "none";

  let needsParams = false;

  if (actions.extractHouseNumbers) {
    needsParams = true;
    actionParamsFields.innerHTML += `
      <label>Source column for house numbers</label>
      <input id="houseSourceColumn" placeholder="e.g. Address" />
    `;
  }

  if (actions.createColumn) {
    needsParams = true;
    actionParamsFields.innerHTML += `
      <label>New column name</label>
      <input id="newColumnName" placeholder="e.g. Notes" />
    `;
  }

  if (needsParams) {
    actionParamsCard.style.display = "block";
  }

  return needsParams;
}

// ======================
// VALIDATION
// ======================
function validateBeforeRun(actions) {
  if (!Object.values(actions).some(v => v)) {
    alert("No valid action detected in your prompt.");
    return false;
  }

  if (actions.extractHouseNumbers) {
    const val = document.getElementById("houseSourceColumn")?.value.trim();
    if (!val) {
      alert("Please specify the column to extract house numbers from.");
      return false;
    }
  }

  if (actions.createColumn) {
    const val = document.getElementById("newColumnName")?.value.trim();
    if (!val) {
      alert("Please provide a name for the new column.");
      return false;
    }
  }

  return true;
}

// ======================
// ENABLE RUN BUTTON
// ======================
function updateRunButton() {
  runBtn.disabled = !(promptInput.value.trim() && fileInput.files.length);
}

promptInput.addEventListener("input", () => {
  const actions = detectActions(promptInput.value.trim());
  renderDetectedActions(actions);
  renderActionParameters(actions);
  updateRunButton();
});

fileInput.addEventListener("change", updateRunButton);

// ======================
// RUN PROMPT
// ======================
runBtn.addEventListener("click", () => {
  const prompt = promptInput.value.trim();
  const file = fileInput.files[0];
  const actions = detectActions(prompt);

  if (!validateBeforeRun(actions)) return;

  statusBox.style.display = "block";
  statusText.textContent = "Reading CSV...";
  progressBar.style.width = "10%";
  progressPercent.textContent = "10%";

  const reader = new FileReader();
  reader.onload = e => {
    try {
      parseCSV(e.target.result);

      previewCard.style.display = "block";
      renderCSVPreview(csvPreviewTable, headers, rows);

      finalRows = [...rows];
      let step = 10;
      const stepSize = 90 / Object.values(actions).filter(v => v).length;

      if (actions.filterRealEstate) {
        statusText.textContent = "Filtering real estate agents...";
        finalRows = window.filterRealEstateAgents(headers, finalRows).agents;
        step += stepSize;
      }

      if (actions.removeMissingEmail) {
        statusText.textContent = "Removing rows missing email...";
        finalRows = window.removeMissingEmail(headers, finalRows).withEmail;
        step += stepSize;
      }

      if (actions.removeDuplicates) {
        statusText.textContent = "Removing duplicates...";
        finalRows = window.removeDuplicates(headers, finalRows).rows;
        step += stepSize;
      }

      if (actions.extractHouseNumbers) {
        statusText.textContent = "Extracting house numbers...";
        const col = document.getElementById("houseSourceColumn").value.trim();
        const result = window.extractHouseNumbers(headers, finalRows, col);
        headers = result.headers;
        finalRows = result.rows;
        step += stepSize;
      }

      if (actions.createColumn) {
        statusText.textContent = "Creating new column...";
        const col = document.getElementById("newColumnName").value.trim();
        const result = window.createNewColumn(headers, finalRows, col);
        headers = result.headers;
        finalRows = result.rows;
        step += stepSize;
      }

      progressBar.style.width = "100%";
      progressPercent.textContent = "100%";

      resultSummary.textContent =
        `Columns: ${headers.length}\n` +
        `Original rows: ${rows.length}\n` +
        `Final rows: ${finalRows.length}`;

      resultCard.style.display = "block";
      downloadBtn.disabled = false;
      statusText.textContent = "Completed";

    } catch (err) {
      alert(err.message);
      statusText.textContent = "Error occurred";
    }
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
