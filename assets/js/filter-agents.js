const STORAGE_KEY = "csv_agent_keywords";

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

/* ================= PREVIEW ================= */
function renderPreview(tableEl, headers, rows, limit = 10) {
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
  const fileInput = document.getElementById("csvFile");
  const analyzeBtn = document.getElementById("analyzeBtn");

  const fileNameEl = document.getElementById("fileName");
  const rowCountEl = document.getElementById("rowCount");
  const columnCountEl = document.getElementById("columnCount");

  const agentCountEl = document.getElementById("agentCount");
  const possibleCountEl = document.getElementById("possibleCount");
  const otherCountEl = document.getElementById("otherCount");

  const agentsPreview = document.getElementById("agentsPreview");
  const possiblePreview = document.getElementById("possiblePreview");
  const othersPreview = document.getElementById("othersPreview");

  const downloadAgents = document.getElementById("downloadAgents");
  const downloadPossible = document.getElementById("downloadPossible");
  const downloadOthers = document.getElementById("downloadOthers");

  const keywordList = document.getElementById("keywordList");
  const newKeyword = document.getElementById("newKeyword");
  const addKeywordBtn = document.getElementById("addKeywordBtn");

  let headers = [];
  let agents = [], possible = [], others = [];

  /* ===== Keyword UI ===== */
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
    const v = normalize(newKeyword.value);
    if (!v || keywords.includes(v)) return;
    keywords.push(v);
    saveKeywords();
    newKeyword.value = "";
    renderKeywords();
  };

  renderKeywords();

  fileInput.onchange = () => {
    const file = fileInput.files[0];
    if (!file) return;
    fileNameEl.textContent = "File name: " + file.name;
    analyzeBtn.disabled = false;
    analyzeBtn.classList.add("enabled");
  };

  analyzeBtn.onclick = () => {
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
          sources.size ? Array.from(sources).join(" + ") : "None",
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

    reader.readAsText(fileInput.files[0]);
  };

  function downloadCSV(name, data) {
    const csv = [headers, ...data].map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv]));
    a.download = name;
    a.click();
  }

  downloadAgents.onclick = () => agents.length && downloadCSV("agents_high_confidence.csv", agents);
  downloadPossible.onclick = () => possible.length && downloadCSV("agents_possible_review.csv", possible);
  downloadOthers.onclick = () => others.length && downloadCSV("other_contacts.csv", others);
});
