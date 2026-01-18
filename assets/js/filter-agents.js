const STORAGE_KEY = "csv_agent_keywords";

let keywords = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [
  "realtor","realty","broker","brokerage","kw","coldwell","century","sotheby","estate"
];

function saveKeywords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keywords));
}

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

  let headers = [], rows = [], agents = [], others = [];

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

  fileInput.onchange = () => {
    const file = fileInput.files[0];
    if (!file) return;
    fileNameEl.textContent = "File name: " + file.name;
    analyzeBtn.classList.add("enabled");
    analyzeBtn.disabled = false;
  };

  analyzeBtn.onclick = () => {
    const reader = new FileReader();
    reader.onload = e => {
      const parsed = e.target.result.trim().split("\n").map(r => r.split(","));
      headers = parsed[0];
      rows = parsed.slice(1);

      rowCountEl.textContent = "Total rows: " + rows.length;
      columnCountEl.textContent = "Detected columns: " + headers.length;

      const emailCols = headers
        .map((h,i)=>h.toLowerCase().includes("email")?i:null)
        .filter(i=>i!==null);

      agents = [];
      others = [];

      rows.forEach(r => {
        const isAgent = emailCols.some(i =>
          r[i] && keywords.some(k => r[i].toLowerCase().includes(k))
        );
        isAgent ? agents.push(r) : others.push(r);
      });

      agentCountEl.textContent = agents.length;
      otherCountEl.textContent = others.length;

      renderPreview(agentsPreview, headers, agents);
      renderPreview(othersPreview, headers, others);

      downloadAgents.classList.add("enabled");
      downloadOthers.classList.add("enabled");
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

  downloadAgents.onclick = () => agents.length && downloadCSV("real_estate_agents.csv", agents);
  downloadOthers.onclick = () => others.length && downloadCSV("other_contacts.csv", others);
});
