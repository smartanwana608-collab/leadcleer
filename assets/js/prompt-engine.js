// ======================
// PROMPT ENGINE — FINAL V4 (PRODUCTION SAFE)
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

const progressBar = document.getElementById("progressBar");
const progressPercent = document.getElementById("progressPercent");

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
// PROMPT DETECTOR (MATCHES UI WORDING)
// ======================
function detectActions(prompt) {
  const p = prompt.toLowerCase();

  return {
    filterRealEstate: p.includes("filter real estate"),
    removeMissingEmail: p.includes("missing email"),
    removeDuplicates: p.includes("duplicate"),
    extractHouseNumbers: p.includes("house"),
    createColumn: p.includes("new column"),
  };
}

// ======================
// ACTION LIST UI
// ======================
function renderDetectedActions(actions) {
  detectedActionsList.innerHTML = "";

  const labels = {
    filterRealEstate: "Filter real estate agents",
    removeMissingEmail: "Remove rows missing email",
    removeDuplicates: "Remove duplicate contacts",
    extractHouseNumbers: "Extract house numbers",
    createColumn: "Create a new column",
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
// ENABLE RUN BUTTON
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
// RUN PROMPT (SAFE EXECUTION)
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

  if (!Object.values(actions).some(Boolean)) {
    alert(
      "No valid action detected.\n\n" +
      "Please use one of the supported actions shown below the prompt box."
    );
    return;
  }

  // Reset UI
  progressBar.style.width = "0%";
  progressPercent.textContent = "0%";
  downloadBtn.disabled = true;
  resultCard.style.display = "none";

  statusBox.style.display = "block";
  statusText.textContent = "Reading CSV…";

  const reader = new FileReader();

  reader.onload = e => {
    parseCSV(e.target.result);

    progressBar.style.width = "25%";
    progressPercent.textContent = "25%";

    previewCard.style.display = "block";
    renderCSVPreview(csvPreviewTable, headers, rows);

    finalRows = [...rows];

    try {
      statusText.textContent = "Applying selected actions…";
      progressBar.style.width = "50%";
      progressPercent.textContent = "50%";

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
        const result = window.extractHouseNumbers(headers, finalRows);
        headers = result.headers;
        finalRows = result.rows;
      }

      if (actions.createColumn) {
        const result = window.createNewColumn(headers, finalRows);
        headers = result.headers;
        finalRows = result.rows;
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
      console.error(err);
      alert(
        "This action cannot be applied to this CSV.\n\n" +
        "Please choose another action or upload a different file."
      );
      statusText.textContent = "Failed";
    }
  };

  reader.readAsText(file);
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
