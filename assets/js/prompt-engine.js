// assets/js/prompt-engine.js

import { filterRealEstate } from "./actions/filter-real-estate.js";
import { removeDuplicates } from "./actions/remove-duplicates.js";
import { removeMissingEmails } from "./actions/remove-missing-emails.js";

let parsedRows = [];

/* ================= ACTION REGISTRY ================= */

const ACTIONS = [
  {
    name: "filter real estate",
    handler: filterRealEstate,
    aliases: [
      "filter real estate",
      "real estate",
      "realty",
      "agents",
      "brokerage",
      "broker"
    ]
  },
  {
    name: "remove duplicates",
    handler: removeDuplicates,
    aliases: [
      "remove duplicates",
      "dedupe",
      "delete duplicates"
    ]
  },
  {
    name: "remove missing emails",
    handler: removeMissingEmails,
    aliases: [
      "remove missing emails",
      "clean emails",
      "delete empty emails"
    ]
  }
];

/* ================= HELPERS ================= */

function normalize(text) {
  return text.toLowerCase().trim();
}

function matchAction(prompt) {
  const input = normalize(prompt);

  for (const action of ACTIONS) {
    if (action.aliases.some(alias => input.includes(alias))) {
      return action;
    }
  }

  return null;
}

/* ================= RENDERING ================= */

function renderResults(result) {
  const container = document.getElementById("promptResults");
  container.innerHTML = "";

  const section = document.createElement("div");
  section.className = "tool-card";

  section.innerHTML = `
    <h2>${result.title}</h2>
    <p>${result.summary}</p>

    <h3>Preview</h3>
    ${renderTable(result.preview)}

    <div class="download-actions">
      <button class="btn primary" onclick="downloadCSV()">Download CSV</button>
    </div>
  `;

  container.appendChild(section);
  window.__DOWNLOAD_DATA__ = result.download;
}

function renderTable(rows) {
  if (!rows || !rows.length) return "<p>No rows found.</p>";

  const headers = Object.keys(rows[0]);

  return `
    <div class="table-wrap">
      <table class="preview-table">
        <thead>
          <tr>
            ${headers.map(h => `<th>${h}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${rows
            .slice(0, 5)
            .map(
              row =>
                `<tr>
                  ${headers.map(h => `<td>${row[h] ?? ""}</td>`).join("")}
                </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

/* ================= DOWNLOAD ================= */

window.downloadCSV = function () {
  const rows = window.__DOWNLOAD_DATA__;
  if (!rows || !rows.length) return;

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map(r => headers.map(h => `"${r[h] ?? ""}"`).join(","))
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "result.csv";
  a.click();

  URL.revokeObjectURL(url);
};

/* ================= EVENTS ================= */

document.addEventListener("DOMContentLoaded", () => {
  const runBtn = document.getElementById("runPromptBtn");
  const promptInput = document.getElementById("promptInput");

  runBtn.addEventListener("click", () => {
    const action = matchAction(promptInput.value);

    if (!action) {
      document.getElementById("promptResults").innerHTML = `
        <div class="tool-card">
          <p>
            We don’t have an action for that yet.<br />
            Try one of the available actions.
          </p>
        </div>
      `;
      return;
    }

    const result = action.handler(parsedRows);
    renderResults(result);
  });

  document.addEventListener("csvParsed", e => {
    parsedRows = e.detail.rows;
  });
});
