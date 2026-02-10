/* ================= BASIC HELPERS ================= */
const el = id => document.getElementById(id);
const get = k => JSON.parse(localStorage.getItem(k) || "[]");
const set = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const now = () => new Date().toISOString();

/* ================= LOGIN ================= */
function login(){
  const u = el("username");
  const p = el("password");

  if(!u || !p){
    alert("Login fields not found");
    return;
  }

  if(u.value === "admin" && p.value === "admin"){
    localStorage.setItem("logged", "yes");
    window.location.href = "dashboard.html";
  } else {
    alert("Invalid Username or Password");
  }
}

function checkLogin(){
  if(localStorage.getItem("logged") !== "yes"){
    window.location.href = "index.html";
  }
}

function logout(){
  localStorage.removeItem("logged");
  window.location.href = "index.html";
}

/* ================= RESUME PARSER (DOES NOT TOUCH NOTES) ================= */
function parseResume(text){
  if(!text || text.length < 40) return;

  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if(email && !el("rpEmail").value) el("rpEmail").value = email[0];

  const phone = text.match(/(\+1\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
  if(phone && !el("rpPhone").value) el("rpPhone").value = phone[0];

  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  if(lines[0] && !el("rpName").value) el("rpName").value = lines[0];

  const states = [
    "New York","New Jersey","California","Texas","Florida","Virginia",
    "Georgia","Illinois","Arizona","Washington","Massachusetts",
    "North Carolina","South Carolina","Ohio","Michigan","Pennsylvania"
  ];
  if(!el("rpLocation").value){
    for(const s of states){
      if(new RegExp(s,"i").test(text)){
        el("rpLocation").value = s;
        break;
      }
    }
  }

  const visas = {
    "US Citizen":/usc|citizen/i,
    "Green Card":/green card|gc/i,
    "H1B":/h1b/i,
    "H4 EAD":/h4\s?ead/i,
    "OPT EAD":/opt\s?ead/i
  };
  if(!el("rpVisa").value){
    for(const v in visas){
      if(visas[v].test(text)){
        el("rpVisa").value = v;
        break;
      }
    }
  }
}

/* ================= JD FUNCTIONS (FIX) ================= */
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
  const t = el("jdTable");
  if(!t) return;

  t.innerHTML = "";
  get("jd").forEach((r,i)=>{
    t.innerHTML += `
      <tr>
        <td>${r.date.split("T")[0]}</td>
        <td>${r.nvr}</td>
        <td>${r.subject}</td>
        <td>
          <select onchange="updateJD(${i},this.value)">
            ${["Active","Hold","Closed"]
              .map(s=>`<option ${r.status===s?"selected":""}>${s}</option>`).join("")}
          </select>
        </td>
        <td><button onclick="delJD(${i})">Delete</button></td>
      </tr>
    `;
  });
}

function updateJD(i,v){
  const d = get("jd");
  d[i].status = v;
  set("jd", d);
  renderAll();
}

function delJD(i){
  const d = get("jd");
  d.splice(i,1);
  set("jd", d);
  renderAll();
}

/* ================= SAVE TO DAILY ================= */
function saveToDaily(){
  const d = get("daily");
  d.unshift({
    date: now(),
    name: el("rpName").value,
    email: el("rpEmail").value,
    phone: el("rpPhone").value,
    job: "",
    source: "",
    location: el("rpLocation").value,
    visa: el("rpVisa").value,
    followup: "",
    notes: ""
  });
  set("daily", d);
  renderAll();
}

/* ================= COMMON HELPERS ================= */
function upd(tab, i, k, v){
  const d = get(tab);
  d[i][k] = v;
  set(tab, d);
}

function del(tab, i){
  const d = get(tab);
  d.splice(i, 1);
  set(tab, d);
  renderAll();
}

function route(from, to, i){
  const r = { ...get(from)[i], date: now() };
  const d = get(to);
  d.unshift(r);
  set(to, d);
  renderAll();
}

/* ================= ACTIVE JD ================= */
function activeJDOptions(sel){
  return get("jd")
    .filter(j => j.status === "Active")
    .map(j => `<option ${sel === j.subject ? "selected" : ""}>${j.subject}</option>`)
    .join("");
}

/* ================= DAILY ================= */
function renderDaily(){
  const t = el("dailyTable");
  if(!t) return;

  t.innerHTML = "";
  get("daily").forEach((r, i) => {
    t.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>${r.date.split("T")[0]}</td>
        <td><input value="${r.name}" oninput="upd('daily',${i},'name',this.value)"></td>
        <td><input value="${r.email}" oninput="upd('daily',${i},'email',this.value)"></td>
        <td><input value="${r.phone}" oninput="upd('daily',${i},'phone',this.value)"></td>
        <td>
          <select onchange="upd('daily',${i},'job',this.value)">
            <option></option>${activeJDOptions(r.job)}
          </select>
        </td>
        <td>
          <select onchange="upd('daily',${i},'source',this.value)">
            <option></option>
            ${["Dice","Monster","LinkedIn","Indeed","Referral"]
              .map(s => `<option ${r.source === s ? "selected" : ""}>${s}</option>`).join("")}
          </select>
        </td>
        <td><input value="${r.location}" oninput="upd('daily',${i},'location',this.value)"></td>
        <td><input value="${r.visa}" oninput="upd('daily',${i},'visa',this.value)"></td>
        <td>
          <input type="datetime-local" value="${r.followup || ""}"
            onchange="upd('daily',${i},'followup',this.value)">
        </td>
        <td>
          <textarea oninput="upd('daily',${i},'notes',this.value)">${r.notes || ""}</textarea>
        </td>
        <td>
          <button onclick="route('daily','submission',${i})">Add Submission</button>
          <button onclick="route('daily','proposal',${i})">Add Proposal</button>
          <button onclick="del('daily',${i})">Delete</button>
        </td>
      </tr>
    `;
  });
}

/* ================= STAGES ================= */
function renderStage(tab){
  const e = el(tab);
  if(!e) return;

  e.innerHTML = `
    <table class="table table-bordered">
      <thead>
        <tr>
          <th>Date</th><th>Name</th><th>Email</th><th>Phone</th>
          <th>Job</th><th>Location</th><th>Visa</th><th>Notes</th><th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${get(tab).map((r, i) => `
          <tr>
            <td>${r.date.split("T")[0]}</td>
            <td>${r.name}</td>
            <td>${r.email}</td>
            <td>${r.phone}</td>
            <td>${r.job}</td>
            <td>${r.location}</td>
            <td>${r.visa}</td>
            <td><textarea oninput="upd('${tab}',${i},'notes',this.value)">${r.notes || ""}</textarea></td>
            <td>
              ${tab === "submission" ? `
                <button onclick="route('submission','interview',${i})">Add Interview</button>
                <button onclick="route('submission','placement',${i})">Add Placement</button>
                <button onclick="route('submission','start',${i})">Add Start</button>
              ` : ""}
              <button onclick="del('${tab}',${i})">Delete</button>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

/* ================= HOME ================= */
function renderHome(){
  const year = 2026;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const count = (tab, m) =>
    get(tab).filter(r => {
      const d = new Date(r.date);
      return d.getFullYear() === year && d.getMonth() === m;
    }).length;

  el("subCount").innerText = get("submission").length;
  el("intCount").innerText = get("interview").length;
  el("placeCount").innerText = get("placement").length;
  el("startCount").innerText = get("start").length;

  const tb = el("yearlyReportTable");
  tb.innerHTML = "";
  months.forEach((m, i) => {
    tb.innerHTML += `
      <tr>
        <td><b>${m}</b></td>
        <td>${count("submission", i)}</td>
        <td>${count("interview", i)}</td>
        <td>${count("placement", i)}</td>
        <td>${count("start", i)}</td>
      </tr>
    `;
  });
}

/* ================= INIT ================= */
function renderAll(){
  renderJD();        // ✅ FIX
  renderDaily();
  ["submission","proposal","interview","placement","start"].forEach(renderStage);
  renderHome();
}

window.onload = renderAll;
