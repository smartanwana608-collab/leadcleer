// ======================
// PROMPT ENGINE — BASELINE TEST (SAFE)
// ======================

console.log("✅ Prompt Engine Loaded");

// DOM
const promptInput = document.getElementById("promptInput");
const fileInput = document.getElementById("csvFile");
const runBtn = document.getElementById("runBtn");

const statusBox = document.getElementById("statusBox");
const statusText = document.getElementById("statusText");

const resultCard = document.getElementById("resultCard");
const resultSummary = document.getElementById("resultSummary");

// Enable button safely
function updateRunButton() {
  runBtn.disabled = !(
    promptInput.value.trim().length > 0 &&
    fileInput.files.length > 0
  );
  runBtn.classList.toggle("enabled", !runBtn.disabled);
}

promptInput.addEventListener("input", updateRunButton);
fileInput.addEventListener("change", updateRunButton);

// CSV Parser (simple & safe)
function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim());
  const rows = lines.slice(1).map(r => r.split(","));
  return { headers, rows };
}

// RUN PROMPT
runBtn.addEventListener("click", () => {
  statusBox.style.display = "block";
  statusText.textContent = "Processing…";

  const promptText = promptInput.value.toLowerCase();

  const reader = new FileReader();
  reader.onload = e => {
    const { headers, rows } = parseCSV(e.target.result);

    // 🔍 ACTION DETECTION (SAFE)
    if (promptText.includes("real estate")) {
      if (typeof window.filterRealEstateAgents !== "function") {
        alert("❌ filterRealEstateAgents is not loaded");
        return;
      }

      const result = window.filterRealEstateAgents(headers, rows);

      resultSummary.textContent =
        "Rows before: " + rows.length + "\n" +
        "Rows after: " + result.rows.length;

      resultCard.style.display = "block";
      statusText.textContent = "Completed";
      return;
    }

    alert("No supported action detected.");
    statusText.textContent = "Idle";
  };

  reader.readAsText(fileInput.files[0]);
});
