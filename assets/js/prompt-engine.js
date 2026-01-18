// ===============================
// PROMPT ENGINE — SAFE MINIMAL
// ===============================

const promptInput = document.getElementById("promptInput");
const fileInput = document.getElementById("csvFile");
const runBtn = document.getElementById("runBtn");

const statusBox = document.getElementById("statusBox");
const statusText = document.getElementById("statusText");
const resultCard = document.getElementById("resultCard");
const resultSummary = document.getElementById("resultSummary");

let headers = [];
let rows = [];

// -------------------------------
// CSV PARSER (simple + safe)
// -------------------------------
function parseCSV(text) {
  const lines = text.trim().split("\n");
  headers = lines[0].split(",").map(h => h.trim());
  rows = lines.slice(1).map(r => r.split(","));
}

// -------------------------------
// ENABLE RUN BUTTON
// -------------------------------
function updateRunBtn() {
  runBtn.disabled = !(
    promptInput.value.trim() &&
    fileInput.files.length
  );
}

promptInput.addEventListener("input", updateRunBtn);
fileInput.addEventListener("change", updateRunBtn);

// -------------------------------
// RUN PROMPT
// -------------------------------
runBtn.addEventListener("click", () => {
  const prompt = promptInput.value.toLowerCase();
  const file = fileInput.files[0];
  if (!file) return;

  statusBox.style.display = "block";
  statusText.textContent = "Reading CSV...";

  const reader = new FileReader();

  reader.onload = e => {
    try {
      parseCSV(e.target.result);

      let finalHeaders = headers;
      let finalRows = rows;

      // ✅ FILTER REAL ESTATE
      if (prompt.includes("real estate")) {
        if (typeof window.filterRealEstateAgents !== "function") {
          throw new Error("filterRealEstateAgents is not loaded");
        }

        const result = window.filterRealEstateAgents(
          finalHeaders,
          finalRows
        );

        finalHeaders = result.headers;
        finalRows = result.rows;

        resultSummary.textContent =
          `Filtered real estate agents\n` +
          `Rows returned: ${finalRows.length}`;
      }

      resultCard.style.display = "block";
      statusText.textContent = "Completed";

    } catch (err) {
      console.error(err);
      statusText.textContent = "Error — check console";
    }
  };

  reader.readAsText(file);
});
