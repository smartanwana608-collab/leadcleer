let keywords = [
  "remax","sutton","rlp","c21","century","coldwell","sotheby",
  "exp","kw",
  "real","realty","broker","brokerage",
  "agent","Abingdon Moore Realty", "realtor",
  "home","homes","estate","Advanced Property Management & Real Estate",
  "Alexandrite Real Estate Ltd","Ardent Properties Inc","Associa British Columbia Inc",
  "AY Victoria Realty Ltd","B.C. Farm & Ranch Realty Corp","Bel Air Realty Group","Breakwater Realty Inc",
  "Burr Properties Ltd","Capital Asset Group","Capital Asset Group","CBRE Limited","Century 21 Harbour Realty Ltd",
  "Clover Residential Ltd","Coastal Life Realty Ltd","Coldwell Banker Oceanside Real Estate","Coldwell Banker Oceanside Real Estate",
  "Colliers","Colliers International (Nan)","Couverdon Realty Ltd","Cushman & Wakefield ULC","D.F.H. Real Estate Ltd. (CwnBy)",
  "Dark Horse Realty","Day Team Realty Ltd","Devon Properties","DFH Real Estate - Sidney","DFH Real Estate - West Shore",
  "DFH Real Estate Ltd","Dockside Realty Ltd","Easy List Realty",
];

let rows = [];
let headers = [];
let results = { agents: [], possible: [], others: [] };

const keywordBox = document.getElementById("keywordBox");

function renderKeywords() {
  keywordBox.innerHTML = "";
  keywords.forEach((k, i) => {
    const el = document.createElement("div");
    el.className = "keyword";
    el.innerHTML = `${k} <span onclick="removeKeyword(${i})">×</span>`;
    keywordBox.appendChild(el);
  });
}
renderKeywords();

function addKeyword() {
  const input = document.getElementById("newKeyword");
  const val = input.value.trim().toLowerCase();
  if (val && !keywords.includes(val)) {
    keywords.push(val);
    renderKeywords();
  }
  input.value = "";
}

function removeKeyword(i) {
  keywords.splice(i, 1);
  renderKeywords();
}

document.getElementById("csvInput").addEventListener("change", e => {
  Papa.parse(e.target.files[0], {
    header: true,
    skipEmptyLines: true,
    complete: res => {
      rows = res.data;
      headers = Object.keys(rows[0] || {});

      document.getElementById("fileName").textContent = e.target.files[0].name;
      document.getElementById("rowCount").textContent = rows.length;
      document.getElementById("colCount").textContent = headers.length;
    }
  });
});

function analyzeCSV() {
  results = { agents: [], possible: [], others: [] };

  rows.forEach(r => {
    const text = (
      (r.Email || "") +
      (r.Company || "") +
      (r["First Name"] || "") +
      (r["Last Name"] || "")
    ).toLowerCase();

    let score = 0;
    keywords.forEach(k => {
      if (text.includes(k)) score++;
    });

    if (score >= 3) results.agents.push(r);
    else if (score === 2) results.possible.push(r);
    else results.others.push(r);
  });

  renderTable("agentsTable", results.agents);
  renderTable("possibleTable", results.possible);
  renderTable("othersTable", results.others);

  document.getElementById("agentCount").textContent = results.agents.length;
  document.getElementById("possibleCount").textContent = results.possible.length;
  document.getElementById("otherCount").textContent = results.others.length;
}

function renderTable(id, data) {
  const table = document.getElementById(id);
  table.innerHTML = "";
  if (!data.length) return;

  const head = document.createElement("tr");
  headers.forEach(h => {
    const th = document.createElement("th");
    th.textContent = h;
    head.appendChild(th);
  });
  table.appendChild(head);

  data.slice(0, 5).forEach(r => {
    const tr = document.createElement("tr");
    headers.forEach(h => {
      const td = document.createElement("td");
      td.textContent = r[h] || "";
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });
}

function downloadCSV(type) {
  const csv = Papa.unparse(results[type]);
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${type}.csv`;
  a.click();
}
// Mobile menu toggle — page-only
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("menuToggle");
  const nav = document.getElementById("mobileNav");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      nav.classList.toggle("open");
    });
  }
});
