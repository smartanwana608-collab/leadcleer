/***************************************************
 * Leadcleer – Filter Real Estate Agents (v2)
 * Multi-signal detection with audit transparency
 ***************************************************/

const STORAGE_KEY = "csv_agent_keywords";

/* ================= DEFAULT KEYWORDS ================= */
let keywords = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [
  "remax","sutton","rlp","c21","century",
  "realty","real","exp","kw","coldwell",
  "broker","brokerage","agent","homes","home"
];

function saveKeywords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keywords));
}

/* ================= PREVIEW TABLE ================= */
function renderPreview(tableEl, headers, rows, limit = 10) {
  tableEl.innerHTML = "";

  if (!rows.length) {
    tableEl.innerHTML = "<tr><td>No data</td></tr>";
    return;
  }

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");

  headers.forEach(h => {
    const th = document.createElement("th");
    th.textContent = h;
    headRow.appendChild(th);
  });

  thead.appendChild(headRow);
  tableEl.appendChild(thead);

  const tbody = document.createElement("tbody");
  rows.slice(0, limit).forEach(row => {
    const tr = document.createElement("tr");
    row.forEach(cell => {
      const td = document.createElement("td");
      td.textContent = cell ?? "";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  tableEl.appendChild(tbody);
}

/* ================= MAIN ================= */
document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("csvFile");
  const analyzeBtn = document.getElementById("analyzeBtn");

  const fileNameEl = document.getElementById("fileName");
  const rowCountEl = document.getElementById("rowCount");
  const columnCountEl = document.getElementById("columnCount");

  const agentCountEl = document.getElementById("agentCount");
  const otherCountEl = document.getElementById("otherCount");

  const agentsPreview = document.getElementById("agentsPreview");
  const othersPreview = document.getElementById("othersPreview");

  const downloadAgents = document.getElementById("downloadAgents");
  const downloadOthers = document.getElementById("downloadOthers");

  const keywordList = document.getElementById("keywordList");
  const newKeyword = document.getElementById("newKeyword");
  const addKeywordBtn = document.getElementById("addKeywordBtn");

  let headers = [];
  let rows = [];
  let agents = [];
  let others = [];

  /* ================= KEYWORD UI ================= */
  function renderKeywords() {
    keywordList.innerHTML = "";
    keywords.forEach((k, i) => {
      const el = document.createElement("div");
      el.className = "keyword";
      el.innerHTML = `${k} <button data-i="${i}">×</button>`;
      keywordList.appendChild(el);
    });

    keywordList.querySelectorAll("button").forEach(btn => {
      btn.onclick = () => {
        keywords.splice(btn.dataset.i, 1);
        saveKeywords();
        renderKeywords();
      };
    });
  }

  addKeywordBtn.onclick = () => {
    const v = newKeyword.value.trim().toLowerCase();
    if (!v || keywords.includes(v)) return;
    keywords.push(v);
    saveKeywords();
    newKeyword.value = "";
    renderKeywords();
  };

  renderKeywords();

  /* ================= FILE LOAD ================= */
  fileInput.onchange = () => {
    const file = fileInput.files[0];
    if (!file) return;
    fileNameEl.textContent = "File name: " + file.name;
    analyzeBtn.disabled = false;
    analyzeBtn.classList.add("enabled");
  };

  /* ================= ANALYSIS ================= */
  analyzeBtn.onclick = () => {
    const reader = new FileReader();

    reader.onload = e => {
      const parsed = e.target.result
        .trim()
        .split("\n")
        .map(r => r.split(","));

      headers = parsed[0];
      rows = parsed.slice(1);

      rowCountEl.textContent = "Total rows: " + rows.length;
      columnCountEl.textContent = "Detected columns: " + headers.length;

      /* ---- COLUMN DETECTION ---- */
      const emailCols = headers
        .map((h,i)=> h.toLowerCase().includes("email") ? i : null)
        .filter(i=>i!==null);

      const companyCols = headers
        .map((h,i)=> ["company","brokerage","office","organization"]
          .some(k=>h.toLowerCase().includes(k)) ? i : null)
        .filter(i=>i!==null);

      const nameCols = headers
        .map((h,i)=> ["name","first","last"]
          .some(k=>h.toLowerCase().includes(k)) ? i : null)
        .filter(i=>i!==null);

      agents = [];
      others = [];

      const enhancedHeaders = [
        ...headers,
        "leadcleer_agent_status",
        "leadcleer_detection_source"
      ];

      rows.forEach(r => {
        let signals = {
          email: false,
          company: false,
          name: false
        };

        /* ---- EMAIL SIGNAL (STRONG) ---- */
        signals.email = emailCols.some(i =>
          r[i] && keywords.some(k => r[i].toLowerCase().includes(k))
        );

        /* ---- COMPANY SIGNAL (VERY STRONG) ---- */
        signals.company = companyCols.some(i =>
          r[i] && keywords.some(k => r[i].toLowerCase().includes(k))
        );

        /* ---- NAME SIGNAL (WEAK / CONTROLLED) ---- */
        signals.name = nameCols.some(i =>
          r[i] &&
          keywords.some(k => r[i].toLowerCase().includes(k)) &&
          r[i].length > k.length + 3
        );

        const signalCount = Object.values(signals).filter(Boolean).length;

        let status = "Not Agent";
        let source = "None";

        if (signalCount >= 2) {
          status = "Agent";
          source = Object.keys(signals).filter(s => signals[s]).join(", ");
        } else if (signalCount === 1) {
          status = "Possible Agent";
          source = Object.keys(signals).find(s => signals[s]);
        }

        const enhancedRow = [...r, status, source];

        if (status === "Agent") {
          agents.push(enhancedRow);
        } else {
          others.push(enhancedRow);
        }
      });

      headers = enhancedHeaders;

      agentCountEl.textContent = agents.length;
      otherCountEl.textContent = others.length;

      renderPreview(agentsPreview, headers, agents);
      renderPreview(othersPreview, headers, others);

      downloadAgents.classList.add("enabled");
      downloadOthers.classList.add("enabled");
    };

    reader.readAsText(fileInput.files[0]);
  };

  /* ================= DOWNLOAD ================= */
  function downloadCSV(name, data) {
    const csv = [headers, ...data].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
  }

  downloadAgents.onclick = () =>
    agents.length && downloadCSV("real_estate_agents.csv", agents);

  downloadOthers.onclick = () =>
    others.length && downloadCSV("other_contacts.csv", others);
});
