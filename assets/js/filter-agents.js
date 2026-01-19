const STORAGE_KEY = "csv_agent_keywords";

/* ================= KEYWORDS ================= */
let keywords = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [
  "remax","sutton","rlp","c21","century","real","realty","exp",
  "kw","coldwell","broker","brokerage","agent","home","homes"
];

const saveKeywords = () =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keywords));

const normalize = v => (v || "").toString().toLowerCase().trim();

/* ================= CSV PARSER ================= */
function parseCSV(text) {
  const rows = [];
  let row = [], val = "", inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i], n = text[i + 1];

    if (c === '"' && inQuotes && n === '"') {
      val += '"';
      i++;
    } else if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      row.push(val);
      val = "";
    } else if ((c === "\n" || c === "\r") && !inQuotes) {
      if (val || row.length) {
        row.push(val);
        rows.push(row);
        row = [];
        val = "";
      }
    } else {
      val += c;
    }
  }

  if (val || row.length) {
    row.push(val);
    rows.push(row);
  }

  return rows;
}

/* ================= PREVIEW TABLE ================= */
function renderPreview(table, headers, rows) {
  table.innerHTML = "";
  if (!rows.length) return;

  const visibleCols = headers.map((h, i) => ({
    name: h,
    i,
    show: ["email", "first", "last", "leadcleer"].some(k =>
      h.toLowerCase().includes(k)
    )
  })).filter(c => c.show);

  table.innerHTML = `
    <thead>
      <tr>${visibleCols.map(c => `<th>${c.name}</th>`).join("")}</tr>
    </thead>
    <tbody>
      ${rows.slice(0, 10).map(r =>
        `<tr>${visibleCols.map(c =>
          `<td>${r[c.i] || ""}</td>`
        ).join("")}</tr>`
      ).join("")}
    </tbody>
  `;
}

/* ================= CSV DOWNLOAD ================= */
function downloadCSV(filename, headers, data) {
  const escape = v =>
    `"${(v ?? "").toString().replace(/"/g, '""')}"`;

  const csv = [
    headers.map(escape).join(","),
    ...data.map(r => r.map(escape).join(","))
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

/* ================= MAIN ================= */
document.addEventListener("DOMContentLoaded", () => {
  const $ = id => document.getElementById(id);

  const fileInput = $("csvFile");
  const analyzeBtn = $("analyzeBtn");

  const fileNameEl = $("fileName");
  const rowCountEl = $("rowCount");
  const columnCountEl = $("columnCount");

  const agentCount = $("agentCount");
  const possibleCount = $("possibleCount");
  const otherCount = $("otherCount");

  const agentsTable = $("agentsPreviewTable");
  const possibleTable = $("possiblePreviewTable");
  const othersTable = $("othersPreviewTable");

  const downloadAgents = $("downloadAgents");
  const downloadPossible = $("downloadPossible");
  const downloadOthers = $("downloadOthers");

  /* ===== Disclaimer ===== */
  const modal = $("disclaimerModal");
  const accept = $("disclaimerAccept");
  const cancel = $("disclaimerCancel");

  let pendingFile = null;

  analyzeBtn.disabled = true;

  fileInput.onchange = () => {
    pendingFile = fileInput.files[0];
    if (pendingFile) modal.classList.add("show");
  };

  cancel.onclick = () => {
    modal.classList.remove("show");
    fileInput.value = "";
    pendingFile = null;
    analyzeBtn.disabled = true;
  };

  accept.onclick = () => {
    modal.classList.remove("show");
    fileNameEl.textContent = "File name: " + pendingFile.name;
    analyzeBtn.disabled = false;
  };

  analyzeBtn.onclick = () => {
    if (!pendingFile) return;

    const reader = new FileReader();
    reader.onload = e => {
      const parsed = parseCSV(e.target.result);
      if (!parsed.length) return;

      const baseHeaders = parsed[0];

      const headers = [
        ...baseHeaders,
        "leadcleer_agent_status",
        "leadcleer_detection_sources",
        "leadcleer_confidence"
      ];

      const rows = parsed.slice(1);

      rowCountEl.textContent = "Total rows: " + rows.length;
      columnCountEl.textContent = "Detected columns: " + headers.length;

      const agents = [];
      const possible = [];
      const others = [];

      const emailCols = baseHeaders
        .map((h, i) => normalize(h).includes("email") ? i : null)
        .filter(i => i !== null);

      const nameCols = baseHeaders
        .map((h, i) =>
          ["name", "first", "last"].some(k => normalize(h).includes(k))
            ? i
            : null
        )
        .filter(i => i !== null);

      const companyCols = baseHeaders
        .map((h, i) =>
          ["company", "broker"].some(k => normalize(h).includes(k))
            ? i
            : null
        )
        .filter(i => i !== null);

      rows.forEach(r => {
        let score = 0;
        const sources = [];

        if (emailCols.some(i =>
          keywords.some(k => normalize(r[i]).includes(k))
        )) {
          score += 2;
          sources.push("Email");
        }

        if (companyCols.some(i =>
          keywords.some(k => normalize(r[i]).includes(k))
        )) {
          score += 2;
          sources.push("Company");
        }

        if (nameCols.some(i =>
          keywords.some(k => normalize(r[i]).includes(k))
        )) {
          score += 1;
          sources.push("Name");
        }

        let status = "Other";
        let confidence = "Low";

        if (score >= 3) {
          status = "Agent";
          confidence = "High";
        } else if (score === 2) {
          status = "Possible Agent";
          confidence = "Medium";
        }

        const fullRow = [
          ...r,
          status,
          sources.join(" + ") || "None",
          confidence
        ];

        if (status === "Agent") agents.push(fullRow);
        else if (status === "Possible Agent") possible.push(fullRow);
        else others.push(fullRow);
      });

      /* ===== COUNTS ===== */
      agentCount.textContent = agents.length;
      possibleCount.textContent = possible.length;
      otherCount.textContent = others.length;

      /* ===== PREVIEWS ===== */
      renderPreview(agentsTable, headers, agents);
      renderPreview(possibleTable, headers, possible);
      renderPreview(othersTable, headers, others);

      /* ===== DOWNLOADS ===== */
      downloadAgents.onclick = () =>
        downloadCSV("agents_high_confidence.csv", headers, agents);

      downloadPossible.onclick = () =>
        downloadCSV("agents_possible_review.csv", headers, possible);

      downloadOthers.onclick = () =>
        downloadCSV("other_contacts.csv", headers, others);
    };

    reader.readAsText(pendingFile);
  };
});
