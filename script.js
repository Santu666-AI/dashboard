/* ================= HELPERS ================= */

function el(id){ return document.getElementById(id); }
function isDashboard(){ return !!el("dailyTable"); }

/* ================= LOGIN ================= */

function login(){
  const u = el("username"), p = el("password");
  if(!u || !p) return alert("Login fields missing");
  if(u.value==="admin" && p.value==="admin"){
    localStorage.setItem("logged","yes");
    location.href="dashboard.html";
  } else alert("Invalid Username or Password");
}

function checkLogin(){
  if(localStorage.getItem("logged")!=="yes"){
    location.href="index.html";
  }
}

function logout(){
  localStorage.removeItem("logged");
  location.href="index.html";
}

/* ================= STORAGE ================= */

const get = k => JSON.parse(localStorage.getItem(k) || "[]");
const set = (k,v) => localStorage.setItem(k, JSON.stringify(v));

function now(){
  return new Date().toISOString(); // canonical storage
}

/* ================= US DATE HELPERS ================= */

function usHeadline(iso){
  const d = new Date(iso);
  return d.toLocaleDateString("en-US",{
    month:"short", day:"2-digit", year:"numeric"
  }).replace(",", "");
}

function dayKey(iso){
  return iso.split("T")[0];
}

/* ================= NORMALIZER ================= */

function normalize(tab){
  const d = get(tab);
  let c=false;
  d.forEach(r=>{
    if(r.notes===undefined){r.notes="";c=true;}
    if(r.visaNotes===undefined){r.visaNotes="";c=true;}
    if(r.editing===undefined){r.editing=false;c=true;}
  });
  if(c) set(tab,d);
}

/* ================= RESUME PARSER ================= */

function parseResume(text){
  if(!text || text.length < 40) return;

  const email=text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if(email && !el("rpEmail").value) el("rpEmail").value=email[0];

  const phone=text.match(/(\+1\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
  if(phone && !el("rpPhone").value) el("rpPhone").value=phone[0];

  const lines=text.split("\n").map(l=>l.trim()).filter(Boolean);
  if(lines[0] && !el("rpName").value) el("rpName").value=lines[0];

  const states=[
    "New York","New Jersey","California","Texas","Florida","Virginia",
    "Georgia","Illinois","Arizona","Washington","Massachusetts",
    "North Carolina","South Carolina","Ohio","Michigan","Pennsylvania"
  ];
  if(!el("rpLocation").value){
    for(const s of states){
      if(new RegExp(s,"i").test(text)){ el("rpLocation").value=s; break; }
    }
  }

  const visas={
    "US Citizen":/usc|citizen/i,
    "Green Card":/green card|gc/i,
    "H1B":/h1b/i,
    "H4 EAD":/h4\s?ead/i,
    "OPT EAD":/opt\s?ead/i
  };
  if(!el("rpVisa").value){
    for(const v in visas){
      if(visas[v].test(text)){ el("rpVisa").value=v; break; }
    }
  }
}

/* ================= SAVE TO DAILY ================= */

function saveToDaily(){
  const d = get("daily");

  d.unshift({
    date: now(),
    name: el("rpName").value,
    email: el("rpEmail").value,
    phone: el("rpPhone").value,
    job:"",
    location: el("rpLocation").value,
    visa: el("rpVisa").value,
    visaNotes: el("rpVisaNotes").value,
    followup:"",
    notes:"",
    editing:false
  });

  set("daily",d);

  ["rpName","rpEmail","rpPhone","rpLocation","rpVisa","rpVisaNotes","rpNotes"]
    .forEach(id=>el(id)&&(el(id).value=""));

  renderAll();
}

/* ================= TABLE HELPERS ================= */

function upd(tab,i,k,v){ const d=get(tab); d[i][k]=v; set(tab,d); }
function updFollowup(tab,i,v){ const d=get(tab); d[i].followup=v; set(tab,d); }
function toggleEdit(tab,i){ const d=get(tab); d[i].editing=!d[i].editing; set(tab,d); renderAll(); }
function del(tab,i){ const d=get(tab); d.splice(i,1); set(tab,d); renderAll(); }

function route(from,to,i){
  const r={...get(from)[i],date:now(),editing:false};
  const t=get(to); t.unshift(r); set(to,t); renderAll();
}

/* ================= ROW ================= */

function cell(tab,i,k,v){
  return `<td><input value="${v||""}" ${get(tab)[i].editing?"":"disabled"}
    oninput="upd('${tab}',${i},'${k}',this.value)"></td>`;
}

function row(tab,r,i,sl){
  let a="";
  if(tab==="daily") a+=`<button onclick="route('daily','submission',${i})">📤</button>`;
  if(tab==="submission") a+=`
    <button onclick="route('submission','interview',${i})">🎤</button>
    <button onclick="route('submission','placement',${i})">💼</button>
    <button onclick="route('submission','start',${i})">🚀</button>`;
  if(tab==="interview") a+=`
    <button onclick="route('interview','placement',${i})">💼</button>
    <button onclick="route('interview','start',${i})">🚀</button>`;
  if(tab==="placement") a+=`<button onclick="route('placement','start',${i})">🚀</button>`;

  return `<tr>
    <td class="fw-bold">${sl||""}</td>
    <td>${usHeadline(r.date)}</td>
    ${cell(tab,i,'name',r.name)}
    ${cell(tab,i,'email',r.email)}
    ${cell(tab,i,'phone',r.phone)}
    ${cell(tab,i,'job',r.job)}
    ${cell(tab,i,'location',r.location)}
    <td>${r.visa}<div class="small text-muted">${r.visaNotes||""}</div></td>
    <td><input type="datetime-local" value="${r.followup||""}"
      ${r.editing?"":"disabled"} onchange="updFollowup('${tab}',${i},this.value)"></td>
    <td><textarea ${r.editing?"":"disabled"}
      oninput="upd('${tab}',${i},'notes',this.value)">${r.notes||""}</textarea></td>
    <td>
      <button onclick="toggleEdit('${tab}',${i})">${r.editing?"💾":"✏️"}</button>
      ${a}<button onclick="del('${tab}',${i})">🗑️</button>
    </td>
  </tr>`;
}

/* ================= DAILY REPORT ================= */

function renderDaily(){
  normalize("daily");
  const t=el("dailyTable"); if(!t) return;
  t.innerHTML="";

  const data=get("daily");
  const g={};

  data.forEach(r=>{
    const k=dayKey(r.date);
    if(!g[k]) g[k]=[];
    g[k].push(r);
  });

  Object.keys(g).sort((a,b)=>b.localeCompare(a)).forEach(k=>{
    t.innerHTML+=`
      <tr class="table-primary text-center">
        <td colspan="11" class="fw-bold fs-5">${usHeadline(g[k][0].date)}</td>
      </tr>`;
    g[k].forEach((r,idx)=>{
      const real=data.findIndex(x=>x.date===r.date && x.email===r.email && x.phone===r.phone);
      if(real!==-1) t.innerHTML+=row("daily",r,real,idx+1);
    });
  });
}

/* ================= STAGE TABLES ================= */

function renderStage(tab){
  normalize(tab);
  const e=el(tab); if(!e) return;
  const data=get(tab);

  e.innerHTML=`<table class="table"><tbody>${
    data.map((r)=>{
      const i=data.findIndex(x=>x.date===r.date && x.email===r.email && x.phone===r.phone);
      return i!==-1 ? row(tab,r,i) : "";
    }).join("")
  }</tbody></table>`;
}

/* ================= HOME (JAN–DEC) ================= */

function getMonthlyCounts(tab,y){
  const m=Array(12).fill(0);
  get(tab).forEach(r=>{
    const d=new Date(r.date);
    if(d.getFullYear()===y) m[d.getMonth()]++;
  });
  return m;
}

function renderHome(){
  const y=2026;
  const sub=getMonthlyCounts("submission",y);
  const int=getMonthlyCounts("interview",y);
  const plc=getMonthlyCounts("placement",y);
  const st=getMonthlyCounts("start",y);

  el("subCount").innerText=sub.reduce((a,b)=>a+b,0);
  el("intCount").innerText=int.reduce((a,b)=>a+b,0);
  el("placeCount").innerText=plc.reduce((a,b)=>a+b,0);
  el("startCount").innerText=st.reduce((a,b)=>a+b,0);

  const tb=el("yearlyReportTable"); if(!tb) return;
  const m=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  tb.innerHTML="";
  m.forEach((x,i)=>{
    tb.innerHTML+=`<tr><td><b>${x}</b></td><td>${sub[i]}</td><td>${int[i]}</td><td>${plc[i]}</td><td>${st[i]}</td></tr>`;
  });
}

/* ================= INIT ================= */

function renderAll(){
  renderDaily();
  ["submission","proposal","interview","placement","start"].forEach(renderStage);
  renderHome();
}

window.onload=()=>{ if(isDashboard()) renderAll(); };
