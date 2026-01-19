const STORAGE_KEY = "csv_agent_keywords";

/* ================= KEYWORDS ================= */
let keywords = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [
  "remax","sutton","rlp","c21","century","real","realty","exp",
  "kw","coldwell","broker","brokerage","agent","home","homes"
];

function saveKeywords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keywords));
}

const normalize = v => (v || "").toLowerCase().trim();

/* ================= CSV PARSER ================= */
function parseCSV(text) {
  const rows = [];
  let row = [], val = "", q = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i], n = text[i+1];
    if (c === '"' && q && n === '"') { val += '"'; i++; }
    else if (c === '"') q = !q;
    else if (c === "," && !q) { row.push(val); val = ""; }
    else if ((c === "\n" || c === "\r") && !q) {
      if (val || row.length) { row.push(val); rows.push(row); row=[]; val=""; }
    } else val += c;
  }
  if (val || row.length) { row.push(val); rows.push(row); }
  return rows;
}

/* ================= PREVIEW ================= */
function renderPreview(table, headers, rows) {
  table.innerHTML = "";
  if (!rows.length) return;

  const keep = headers.map((h,i)=>({
    name:h,
    i,
    show: ["email","first","last","leadcleer"].some(k=>h.toLowerCase().includes(k))
  })).filter(c=>c.show);

  table.innerHTML =
    `<thead><tr>${keep.map(c=>`<th>${c.name}</th>`).join("")}</tr></thead>` +
    `<tbody>${rows.slice(0,10).map(r =>
      `<tr>${keep.map(c=>`<td>${r[c.i]||""}</td>`).join("")}</tr>`
    ).join("")}</tbody>`;
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

  const agentsPreview = $("agentsPreview");
  const possiblePreview = $("possiblePreview");
  const othersPreview = $("othersPreview");

  const downloadAgents = $("downloadAgents");
  const downloadPossible = $("downloadPossible");
  const downloadOthers = $("downloadOthers");

  /* ===== Disclaimer ===== */
  const modal = $("disclaimerModal");
  const accept = $("disclaimerAccept");
  const cancel = $("disclaimerCancel");
  let pendingFile = null;

  fileInput.onchange = () => {
    pendingFile = fileInput.files[0];
    if (pendingFile) modal.classList.add("show");
  };

  cancel.onclick = () => {
    modal.classList.remove("show");
    fileInput.value = "";
    pendingFile = null;
  };

  accept.onclick = () => {
    modal.classList.remove("show");
    fileNameEl.textContent = "File name: " + pendingFile.name;
    analyzeBtn.disabled = false;
  };

  analyzeBtn.onclick = () => {
    const reader = new FileReader();
    reader.onload = e => {
      const parsed = parseCSV(e.target.result);
      const headers = [...parsed[0],
        "leadcleer_agent_status",
        "leadcleer_detection_sources",
        "leadcleer_confidence"
      ];
      const rows = parsed.slice(1);

      rowCountEl.textContent = "Total rows: " + rows.length;
      columnCountEl.textContent = "Detected columns: " + headers.length;

      const agents=[], possible=[], others=[];
      const emailCols = parsed[0].map((h,i)=>normalize(h).includes("email")?i:null).filter(i=>i!==null);
      const nameCols = parsed[0].map((h,i)=>["name","first","last"].some(k=>normalize(h).includes(k))?i:null).filter(i=>i!==null);
      const companyCols = parsed[0].map((h,i)=>["company","broker"].some(k=>normalize(h).includes(k))?i:null).filter(i=>i!==null);

      rows.forEach(r=>{
        let score=0, src=[];
        if (emailCols.some(i=>keywords.some(k=>normalize(r[i]).includes(k)))) {score+=2;src.push("Email");}
        if (companyCols.some(i=>keywords.some(k=>normalize(r[i]).includes(k)))) {score+=2;src.push("Company");}
        if (nameCols.some(i=>keywords.some(k=>normalize(r[i]).includes(k)))) {score+=1;src.push("Name");}

        let status="Other", conf="Low";
        if (score>=3){status="Agent";conf="High";}
        else if(score===2){status="Possible Agent";conf="Medium";}

        const row=[...r,status,src.join(" + ")||"None",conf];
        if(status==="Agent")agents.push(row);
        else if(status==="Possible Agent")possible.push(row);
        else others.push(row);
      });

      agentCount.textContent = agents.length;
      possibleCount.textContent = possible.length;
      otherCount.textContent = others.length;

      renderPreview(agentsPreview, headers, agents);
      renderPreview(possiblePreview, headers, possible);
      renderPreview(othersPreview, headers, others);

      downloadAgents.onclick=()=>download("agents_high_confidence.csv",headers,agents);
      downloadPossible.onclick=()=>download("agents_possible_review.csv",headers,possible);
      downloadOthers.onclick=()=>download("other_contacts.csv",headers,others);
    };
    reader.readAsText(pendingFile);
  };

  function download(name, headers, data){
    const csv=[headers,...data].map(r=>r.join(",")).join("\n");
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([csv]));
    a.download=name; a.click();
  }
});
