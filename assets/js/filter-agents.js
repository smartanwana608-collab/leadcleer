const SYSTEM_KEYWORDS = [
  "remax","sutton","rlp","c21","century","real","realty",
  "exp","kw","coldwell","broker","brokerage","agent","homes"
];

const normalize = v => (v || "").toLowerCase();

function parseCSV(text) {
  return text.split("\n").map(r => r.split(","));
}

document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("csvFile");
  const analyzeBtn = document.getElementById("analyzeBtn");
  const results = document.getElementById("resultsPreview");

  const agentCount = document.getElementById("agentCount");
  const possibleCount = document.getElementById("possibleCount");
  const otherCount = document.getElementById("otherCount");

  const agentsTable = document.getElementById("agentsPreviewTable");
  const possibleTable = document.getElementById("possiblePreviewTable");
  const othersTable = document.getElementById("othersPreviewTable");

  let headers = [];
  let rows = [];

  fileInput.onchange = e => {
    const reader = new FileReader();
    reader.onload = () => {
      const data = parseCSV(reader.result);
      headers = data[0];
      rows = data.slice(1);
      analyzeBtn.disabled = false;
    };
    reader.readAsText(e.target.files[0]);
  };

  analyzeBtn.onclick = () => {
    const agents = [], possible = [], others = [];

    rows.forEach(r => {
      let score = 0;
      r.forEach(c => {
        SYSTEM_KEYWORDS.forEach(k => {
          if (normalize(c).includes(k)) score++;
        });
      });

      if (score >= 3) agents.push(r);
      else if (score === 2) possible.push(r);
      else others.push(r);
    });

    agentCount.textContent = agents.length;
    possibleCount.textContent = possible.length;
    otherCount.textContent = others.length;

    const render = (table, data) => {
      table.innerHTML =
        `<thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
         <tbody>${data.slice(0,5).map(r =>
           `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`
         ).join("")}</tbody>`;
    };

    render(agentsTable, agents);
    render(possibleTable, possible);
    render(othersTable, others);

    results.classList.add("show");
    results.scrollIntoView({ behavior: "smooth" });
  };
});
