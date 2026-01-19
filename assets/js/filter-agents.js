const BASE_KEYWORDS = [
  "realtor","realty","broker","brokerage","kw",
  "coldwell","century","sotheby","estate","homes",
  "remax","exp"
];

const normalize = v => (v || "").toLowerCase();

let userKeywords = [...BASE_KEYWORDS];

document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("csvFile");
  const analyzeBtn = document.getElementById("analyzeBtn");
  const results = document.getElementById("resultsPreview");

  const fileName = document.getElementById("fileName");
  const rowCount = document.getElementById("rowCount");
  const columnCount = document.getElementById("columnCount");

  const keywordInput = document.getElementById("newKeyword");
  const keywordList = document.getElementById("keywordList");
  const addKeywordBtn = document.getElementById("addKeywordBtn");

  const agentCount = document.getElementById("agentCount");
  const possibleCount = document.getElementById("possibleCount");
  const otherCount = document.getElementById("otherCount");

  const agentsTable = document.getElementById("agentsPreviewTable");
  const possibleTable = document.getElementById("possiblePreviewTable");
  const othersTable = document.getElementById("othersPreviewTable");

  let headers = [];
  let rows = [];

  /* ===== KEYWORDS ===== */
  const renderKeywords = () => {
    keywordList.innerHTML = "";
    userKeywords.forEach(k => {
      const pill = document.createElement("span");
      pill.className = "keyword-pill";
      pill.textContent = `${k} ×`;
      pill.onclick = () => {
        userKeywords = userKeywords.filter(x => x !== k);
        renderKeywords();
      };
      keywordList.appendChild(pill);
    });
  };

  renderKeywords();

  addKeywordBtn.onclick = () => {
    const val = normalize(keywordInput.value);
    if (val && !userKeywords.includes(val)) {
      userKeywords.push(val);
      keywordInput.value = "";
      renderKeywords();
    }
  };

  /* ===== CSV ===== */
  fileInput.onchange = e => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      const lines = reader.result.split("\n").map(r => r.split(","));
      headers = lines[0];
      rows = lines.slice(1);

      fileName.textContent = `File — ${file.name}`;
      rowCount.textContent = `Rows — ${rows.length}`;
      columnCount.textContent = `Columns — ${headers.length}`;

      analyzeBtn.disabled = false;
    };

    reader.readAsText(file);
  };

  analyzeBtn.onclick = () => {
    const agents = [];
    const possible = [];
    const others = [];

    rows.forEach(r => {
      const combined = normalize(
        `${r[0] || ""} ${r[1] || ""} ${r[2] || ""} ${r[3] || ""}`
      );

      let score = 0;
      userKeywords.forEach(k => {
        if (combined.includes(k)) score++;
      });

      if (score >= 2) agents.push(r);
      else if (score === 1) possible.push(r);
      else others.push(r);
    });

    agentCount.textContent = agents.length;
    possibleCount.textContent = possible.length;
    otherCount.textContent = others.length;

    const renderTable = (table, data) => {
      table.innerHTML = `
        <thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
        <tbody>
          ${data.slice(0, 10).map(r =>
            `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`
          ).join("")}
        </tbody>
      `;
    };

    renderTable(agentsTable, agents);
    renderTable(possibleTable, possible);
    renderTable(othersTable, others);

    results.classList.add("show");
    results.scrollIntoView({ behavior: "smooth" });
  };
});
