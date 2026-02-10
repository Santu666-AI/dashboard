/* ===== HELPERS ===== */
const el = id => document.getElementById(id);
const get = k => JSON.parse(localStorage.getItem(k) || "[]");
const set = (k,v) => localStorage.setItem(k, JSON.stringify(v));
const now = () => new Date().toISOString();

/* ===== LOGIN ===== */
function checkLogin(){
  if(localStorage.getItem("logged") !== "yes"){
    location.href = "index.html";
  }
}
function logout(){
  localStorage.removeItem("logged");
  location.href = "index.html";
}

/* ===== CLIENT MASTER ===== */
function getClients(){ return JSON.parse(localStorage.getItem("clients") || "[]"); }
function setClients(c){ localStorage.setItem("clients", JSON.stringify(c)); }

/* ===== JD (UNCHANGED) ===== */
function saveJD(){
  const d = get("jd");
  d.unshift({
    date: now(),
    nvr: el("jdNvr").value,
    subject: el("jdSubject").value,
    text: el("jdText").value,
    status: el("jdStatus").value
  });
  set("jd", d);
  ["jdNvr","jdSubject","jdText"].forEach(id => el(id).value = "");
  renderAll();
}
function renderJD(){
  const t = el("jdTable"); if(!t) return;
  t.innerHTML = "";
  get("jd").forEach((r,i)=>{
    t.innerHTML += `
      <tr>
        <td>${r.date.split("T")[0]}</td>
        <td>${r.nvr}</td>
        <td>${r.subject}</td>
        <td>
          <select onchange="upd('jd',${i},'status',this.value)">
            ${["Active","Hold","Closed"].map(s=>`<option ${r.status===s?"selected":""}>${s}</option>`).join("")}
          </select>
        </td>
        <td><button onclick="del('jd',${i})">Delete</button></td>
      </tr>`;
  });
}

/* ===== RESUME PARSER (UNCHANGED) ===== */
function parseResume(t){
  if(!t || t.length < 40) return;
  const e = t.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if(e && !el("rpEmail").value) el("rpEmail").value = e[0];
}

/* ===== SAVE TO DAILY ===== */
function saveToDaily(){
  const d = get("daily");
  d.unshift({
    date: now(),
    name: el("rpName").value,
    email: el("rpEmail").value,
    phone: el("rpPhone").value,
    job: "",
    client: "",
    source: "",
    location: el("rpLocation").value,
    visa: el("rpVisa").value,
    followup: "",
    notes: ""
  });
  set("daily", d);
  renderAll();
}

/* ===== COMMON ===== */
function upd(tab,i,k,v){
  const d = get(tab);
  d[i][k] = v;
  set(tab, d);
}
function del(tab,i){
  const d = get(tab);
  d.splice(i,1);
  set(tab, d);
  renderAll();
}
function route(from,to,i){
  const r = { ...get(from)[i], date: now() };
  const d = get(to);
  d.unshift(r);
  set(to, d);
  renderAll();
}

/* ===== CLIENT ===== */
function clientOptions(sel){
  return getClients().map(c=>`<option ${c===sel?"selected":""}>${c}</option>`).join("") +
    `<option value="__add__">➕ Add New Client</option>`;
}
function setClient(i,v){
  if(v === "__add__"){
    const n = prompt("Enter Client Name");
    if(!n) return;
    const c = getClients();
    if(!c.includes(n)){ c.push(n); setClients(c); }
    upd("daily", i, "client", n);
  } else {
    upd("daily", i, "client", v);
  }
  renderAll();
}

/* ===== DAILY ===== */
function renderDaily(){
  const t = el("dailyTable"); if(!t) return;
  t.innerHTML = "";
  get("daily").forEach((r,i)=>{
    t.innerHTML += `
      <tr>
        <td>${i+1}</td>
        <td>${r.date.split("T")[0]}</td>
        <td><input value="${r.name}" oninput="upd('daily',${i},'name',this.value)"></td>
        <td><input value="${r.email}" oninput="upd('daily',${i},'email',this.value)"></td>
        <td><input value="${r.phone}" oninput="upd('daily',${i},'phone',this.value)"></td>
        <td><input value="${r.job}" oninput="upd('daily',${i},'job',this.value)"></td>
        <td>
          <select onchange="setClient(${i},this.value)">
            <option></option>${clientOptions(r.client)}
          </select>
        </td>
        <td><input value="${r.source}" oninput="upd('daily',${i},'source',this.value)"></td>
        <td><input value="${r.location}" oninput="upd('daily',${i},'location',this.value)"></td>
        <td><input value="${r.visa}" oninput="upd('daily',${i},'visa',this.value)"></td>
        <td><input type="datetime-local" value="${r.followup||""}"
          oninput="upd('daily',${i},'followup',this.value)"></td>
        <td><textarea oninput="upd('daily',${i},'notes',this.value)">${r.notes||""}</textarea></td>
        <td>
          <button onclick="route('daily','submission',${i})">Submission</button>
          <button onclick="route('daily','proposal',${i})">Proposal</button>
        </td>
      </tr>`;
  });
}

/* ===== STAGES ===== */
function renderStage(tab){
  const e = el(tab); if(!e) return;
  e.innerHTML = `
    <button class="btn btn-sm btn-outline-primary mb-2" onclick="exportCSV('${tab}')">Export</button>
    <table class="table table-bordered">
      <thead>
        <tr>
          <th>Date</th><th>Name</th><th>Email</th><th>Phone</th>
          <th>Job Title</th><th>Client</th>
          ${tab==="proposal"?'<th>Program Name</th>':''}
          ${tab==="interview"?'<th>Interview Scheduled On</th>':''}
          ${tab==="start"?'<th>Started On</th>':''}
          <th>Notes</th><th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${get(tab).map((r,i)=>`
          <tr>
            <td>${r.date.split("T")[0]}</td>
            <td>${r.name}</td>
            <td>${r.email}</td>
            <td>${r.phone}</td>
            <td>${r.job}</td>
            <td>${r.client||""}</td>

            ${tab==="proposal"
              ? `<td><input value="${r.program||""}" oninput="upd('${tab}',${i},'program',this.value)"></td>` : ""}

            ${tab==="interview"
              ? `<td><input type="datetime-local" value="${r.interviewOn||""}"
                   oninput="upd('${tab}',${i},'interviewOn',this.value)"></td>` : ""}

            ${tab==="start"
              ? `<td><input type="date" value="${r.startedOn||""}"
                   oninput="upd('${tab}',${i},'startedOn',this.value)"></td>` : ""}

            <td><textarea oninput="upd('${tab}',${i},'notes',this.value)">${r.notes||""}</textarea></td>
            <td>
              ${tab==="submission"?`
                <button onclick="route('submission','interview',${i})">Interview</button>
                <button onclick="route('submission','placement',${i})">Placement</button>
                <button onclick="route('submission','start',${i})">Start</button>
              `:""}
            </td>
          </tr>`).join("")}
      </tbody>
    </table>
  `;
}

/* ===== HOME AUTO CALC (FIXED) ===== */
function renderHome(){
  const year = new Date().getFullYear();
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const count = (tab, m) =>
    get(tab).filter(r=>{
      const d = new Date(r.date);
      return d.getFullYear()===year && d.getMonth()===m;
    }).length;

  el("subCount").innerText = get("submission").length;
  el("intCount").innerText = get("interview").length;
  el("placeCount").innerText = get("placement").length;
  el("startCount").innerText = get("start").length;

  const tb = el("yearlyReportTable"); if(!tb) return;
  tb.innerHTML = "";
  months.forEach((m,i)=>{
    tb.innerHTML += `
      <tr>
        <td><b>${m}</b></td>
        <td>${count("submission",i)}</td>
        <td>${count("interview",i)}</td>
        <td>${count("placement",i)}</td>
        <td>${count("start",i)}</td>
      </tr>`;
  });
}

/* ===== INIT ===== */
function renderAll(){
  renderJD();
  renderDaily();
  ["submission","proposal","interview","placement","start"].forEach(renderStage);
  renderHome(); // ✅ FIX
}
window.onload = renderAll;
