// ======================
// PROMPT ENGINE — CLEAN V3 (STABLE + SAFE)
// ======================

// ----------------------
// DOM
// ----------------------
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

// ----------------------
// DATA
// ----------------------
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
    // SAFE (NO PARAMS)
    filterRealEstate: p.includes("filter real estate"),
    removeMissingEmail: p.includes("missing email"),
    removeDuplicates: p.includes("duplicate"),

    // PARAMETER REQUIRED (BLOCKED FOR NOW)
    extractHouseNumbers: p.includes("extract house"),
    createNewColumn: p.includes("create a new column"),
    splitByColumn: p.includes("split"),
    fixAddresses: p.includes("fix address")
  };
}

// ======================
// ACTION UI
// ======================
function renderDetectedActions(actions) {
  detectedActionsList.innerHTML = "";

  const labels = {
    filterRealEstate: "Filter real estate agents",
    removeMissingEmail: "Remove rows missing email",
    removeDuplicates: "Remove duplicate contacts",
    extractHouseNumbers: "Extract house numbers (needs parameter)",
    createNewColumn: "Create a new column (needs parameter)",
    splitByColumn: "Split CSV by column (needs parameter)",
    fixAddresses: "Fix addresses (needs parameter)"
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
}

// ======================
// RUN BUTTON ENABLE
// ======================
function updateRunButton() {
  runBtn.disabled = !(promptInput.value.trim() && fileInput.files.length);
}

promptInput.addEventListener("input", () => {
  renderDetectedActions(detectActions(promptInput.value.trim()));
  updateRunButton();
});

fileInput.addEventListener("change", updateRunButton);

// ======================
// RUN PROMPT (SAFE MODE)
// ======================
runBtn.addEventListener("click", () => {
  const prompt = promptInput.value.trim();
  const file = fileInput.files[0];

  if (!prompt) {
    alert("Please write a prompt first.");
    return;
  }

  if (!file) {
    alert("Please upload a CSV file.");
    return;
  }

  const actions = detectActions(prompt);

  if (!Object.values(actions).some(Boolean)) {
    alert("No valid action detected. Use the suggested wording.");
    return;
  }

  // BLOCK PARAMETER ACTIONS
  if (
    actions.extractHouseNumbers ||
    actions.createNewColumn ||
    actions.splitByColumn ||
    actions.fixAddresses
  ) {
    alert(
      "One or more selected actions require parameters.\n\nParameter UI is coming next."
    );
    return;
  }

  statusBox.style.display = "block";
  statusText.textContent = "Reading CSV…";

  const reader = new FileReader();
  reader.onload = e => {
    try {
      parseCSV(e.target.result);

      renderCSVPreview(csvPreviewTable, headers, rows);
      previewCard.style.display = "block";

      finalRows = [...rows];
      statusText.textContent = "Applying selected actions…";

      if (actions.filterRealEstate) {
        finalRows =
          window.filterRealEstateAgents(headers, finalRows).agents;
      }

      if (actions.removeMissingEmail) {
        finalRows =
          window.removeMissingEmail(headers, finalRows).withEmail;
      }

      if (actions.removeDuplicates) {
        finalRows =
          window.removeDuplicates(headers, finalRows).rows;
      }

      resultSummary.textContent =
        `Rows before: ${rows.length}\n` +
        `Rows after: ${finalRows.length}\n` +
        `Columns: ${headers.length}`;

      resultCard.style.display = "block";
      statusText.textContent = "Completed";
    } catch (err) {
      alert(err.message);
      statusBox.style.display = "none";
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
