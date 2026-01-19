/* ===============================
   FILTER AGENT – FINAL JS
================================ */

let keywords = [
  "remax","sutton","rlp","c21","century","coldwell","sotheby",
  "exp","kw",
  "real","realty","broker","brokerage",
  "agent","realtor",
  "home","homes","estate"
];

let rows = [];
let headers = [];
let results = { agents: [], possible: [], others: [] };

const norm = v => (v || "").toString().toLowerCase();

function score(row) {
  let s = 0;
  const email = norm(row.Email);
  const company = norm(row.Company);
  const name = `${norm(row["First Name"])} ${norm(row["Last Name"])}`;

  keywords.forEach(k => {
    if (email.includes(k)) s += 3;
    if (company.includes(k)) s += 3;
    if (name.includes(k)) s += 2;
  });
  return s;
}

document.getElementById("csvInput").addEventListener("change", e => {
  Papa.parse(e.target.files[0], {
    header: true,
    skipEmptyLines: true,
    complete: res => {
      rows = res.data;
      headers = Object.keys(rows[0]);

      document.getElementById("fileName").textContent = e.target.files[0].name;
      document.getElementById("rowCount").textContent = rows.length;
      document.getElementById("colCount").textContent = headers.length;
    }
  });
});

function analyzeCSV() {
  results = { agents: [], possible: [], others: [] };

  rows.forEach(r => {
    const s = score(r);
    if (s >= 4) results.agents.push(r);
    else if (s >= 2) results.possible.push(r);
    else results.others.push(r);
  });

  render("agentsTable", results.agents);
  render("possibleTable", results.possible);
  render("othersTable", results.others);

  document.getElementById("agentCount").textContent = results.agents.length;
  document.getElementById("possibleCount").textContent = results.possible.length;
  document.getElementById("otherCount").textContent = results.others.length;
}

function render(id, data) {
  const table = document.getElementById(id);
  table.innerHTML = "";

  if (!data.length) return;

  const tr = document.createElement("tr");
  headers.forEach(h => {
    const th = document.createElement("th");
    th.textContent = h;
    tr.appendChild(th);
  });
  table.appendChild(tr);

  data.slice(0, 5).forEach(r => {
    const row = document.createElement("tr");
    headers.forEach(h => {
      const td = document.createElement("td");
      td.textContent = r[h] || "";
      row.appendChild(td);
    });
    table.appendChild(row);
  });
}

function download(type) {
  const csv = Papa.unparse(results[type]);
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${type}.csv`;
  a.click();
}
