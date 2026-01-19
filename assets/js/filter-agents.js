const STORAGE_KEY = "csv_agent_keywords";

/* ================= KEYWORDS ================= */
let keywords = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [
  "remax","sutton","rlp","c21","century","real","realty","exp",
  "kw","coldwell","broker","brokerage","agent","home","homes"
];

function saveKeywords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keywords));
}

function normalize(v) {
  return (v || "").toString().toLowerCase().trim();
}

/* ================= SAFE CSV PARSER ================= */
function parseCSV(text) {
  const rows = [];
  let row = [];
  let value = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && insideQuotes && next === '"') {
      value += '"';
      i++;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (value || row.length) {
        row.push(value);
        rows.push(row);
        row = [];
        value = "";
      }
    } else {
      value += char;
    }
  }

  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }

  return rows;
}

/* ================= TABLE PREVIEW ================= */
function renderPreview(tableEl, headers, rows, limit = 10) {
  if (!tableEl) return;

  tableEl.innerHTML = "";

  if (!rows.length) {
    tableEl.innerHTML = "<tr><td>No data</td></tr>";
    return;
  }

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
    const r = document.createElement("tr");
    row.forEach(cell => {
      const td = document.createElement("td");
      td.textContent = cell;
      r.appendChild(td);
    });
    tbody.appendChild(r);
  });

  tableEl.appendChild(tbody);
}

/* ================= MAIN ================= */
document.addEventListener("DOMContentLoaded", () => {
  const $ = id => document.getElementById(id);

  const fileInput = $("csvFile");
  const analyzeBtn = $("analyzeBtn");

  const fileNameEl = $("fileName");
  const rowCountEl = $("rowCount");
  const columnCountEl = $("columnCount");

  const agentCountEl = $("agentCount");
  const possibleCountEl = $("possibleCount");
  const otherCountEl = $("otherCount");

  const agentsPreview = $("agentsPreview");
  const possiblePreview = $("possiblePreview");
  const othersPreview = $("othersPreview");

  const downloadAgents = $("downloadAgents");
  const downloadPossible = $("downloadPossible");
  const downloadOthers = $("downloadOthers");

  const keywordList = $("keywordList");
  const newKeyword = $("newKeyword");
  const addKeywordBtn = $("addKeywordBtn");

  /* ================= DISCLAIMER ================= */
  const disclaimerModal = $("disclaimerModal");
  const disclaimerAccept = $("disclaimerAccept");
  const disclaimerCancel = $("disclaimerCancel");

  let pendingFile = null;

  let headers = [];
  let agents = [], possible = [], others = [];

  /* ================= KEYWORD UI ================= */
  function renderKeywords() {
    if (!keywordList) return;

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
    const v = normalize(newKeyword.value);
    if (!v || keywords.includes(v)) return;
    keywords.push(v);
    saveKeywords();
    newKeyword.value = "";
    renderKeywords();
  };

  renderKeywords();

  /* ================= FILE LOAD (WITH DISCLAIMER) ================= */
  fileInput.onchange = () => {
    const file = fileInput.files[0];
    if (!file) return;

    pendingFile = file;
    disclaimerModal.classList.add("show");
  };

  disclaimerCancel.onclick = () => {
    disclaimerModal.classList.remove("show");
    fileInput.value = "";
    pendingFile = null;
  };

  disclaimerAccept.onclick = () => {
    disclaimerModal.classList.remove("show");
    if (!pendingFile) return;

    fileNameEl.textContent = "File name: " + pendingFile.name;
    analyzeBtn.disabled = false;
    analyzeBtn.classList.add("enabled");
  };

  /* ================= ANALYZE ================= */
  analyzeBtn.onclick = () => {
    if (!pendingFile) return;

    const reader = new FileReader();

    reader.onload = e => {
      const parsed = parseCSV(e.target.result.trim());
      headers = parsed[0];
      const rows = parsed.slice(1);

      rowCountEl.textContent = "Total rows: " + rows.length;
      columnCountEl.textContent = "Detected columns: " + headers.length;

      const emailCols = headers.map((h,i)=>normalize(h).includes("email")?i:null).filter(i=>i!==null);
      const nameCols = headers.map((h,i)=>["name","first","last"].some(k=>normalize(h).includes(k))?i:null).filter(i=>i!==null);
      const companyCols = headers.map((h,i)=>["company","office","brokerage","organization"].some(k=>normalize(h).includes(k))?i:null).filter(i=>i!==null);

      const extendedHeaders = [
        ...headers,
        "leadcleer_agent_status",
        "leadcleer_detection_sources",
        "leadcleer_confidence"
      ];

      agents = [];
      possible = [];
      others = [];

      rows.forEach(r => {
        let score = 0;
        const sources = new Set();

        if (emailCols.some(i => keywords.some(k => normalize(r[i]).includes(k)))) {
          score += 2;
          sources.add("Email");
        }

        if (companyCols.some(i => keywords.some(k => normalize(r[i]).includes(k)))) {
          score += 2;
          sources.add("Company");
        }

        if (nameCols.some(i => keywords.some(k => normalize(r[i]).includes(k)))) {
          score += 1;
          sources.add("Name");
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

        const newRow = [
          ...r,
          status,
          sources.size ? [...sources].join(" + ") : "None",
          confidence
        ];

        if (status === "Agent") agents.push(newRow);
        else if (status === "Possible Agent") possible.push(newRow);
        else others.push(newRow);
      });

      agentCountEl.textContent = agents.length;
      possibleCountEl.textContent = possible.length;
      otherCountEl.textContent = others.length;

      renderPreview(agentsPreview, extendedHeaders, agents);
      renderPreview(possiblePreview, extendedHeaders, possible);
      renderPreview(othersPreview, extendedHeaders, others);

      downloadAgents.classList.add("enabled");
      downloadPossible.classList.add("enabled");
      downloadOthers.classList.add("enabled");

      headers = extendedHeaders;
    };

    reader.readAsText(pendingFile);
  };

  /* ================= DOWNLOAD ================= */
  function downloadCSV(name, data) {
    const csv = [headers, ...data].map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv]));
    a.download = name;
    a.click();
  }

  downloadAgents.onclick = () =>
    agents.length && downloadCSV("agents_high_confidence.csv", agents);

  downloadPossible.onclick = () =>
    possible.length && downloadCSV("agents_possible_review.csv", possible);

  downloadOthers.onclick = () =>
    others.length && downloadCSV("other_contacts.csv", others);

  /* ================= TAB SWITCHING ================= */
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

      tab.classList.add("active");
      const target = document.getElementById("tab-" + tab.dataset.tab);
      if (target) target.classList.add("active");
    });
  });
});
