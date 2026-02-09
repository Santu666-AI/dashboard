/* ================= LOGIN ================= */

function login(){
  if(username.value==="admin" && password.value==="admin"){
    localStorage.setItem("logged","yes");
    location.href="dashboard.html";
  } else {
    alert("Invalid Username or Password");
  }
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
  return new Date().toLocaleString("en-US",{
    year:"numeric",
    month:"2-digit",
    day:"2-digit",
    hour:"2-digit",
    minute:"2-digit",
    second:"2-digit",
    hour12:false
  });
}

/* ================= NOTIFICATION ================= */

if ("Notification" in window && Notification.permission !== "granted") {
  Notification.requestPermission();
}

function scheduleReminder(name, phone, datetime){
  if(!datetime) return;
  const notifyAt = new Date(datetime).getTime() - 10 * 60 * 1000;
  const delay = notifyAt - Date.now();
  if(delay > 0){
    setTimeout(()=>{
      new Notification("Follow-up Reminder",{
        body:`Call ${name}${phone ? " – " + phone : ""}`
      });
    }, delay);
  }
}

/* ================= JD ================= */

function saveJD(){
  const d = get("jd");
  d.unshift({
    date: now(),
    nvr: jdNvr.value,
    subject: jdSubject.value,
    text: jdText.value,
    status: "Active"
  });
  set("jd", d);
  renderJD();
}

function renderJD(){
  if(!window.jdTable) return;
  jdTable.innerHTML="";
  get("jd").forEach(r=>{
    jdTable.innerHTML += `
      <tr>
        <td>${r.date}</td>
        <td>${r.nvr}</td>
        <td>${r.subject}</td>
        <td>${r.status}</td>
      </tr>`;
  });
}

/* ================= RESUME → DAILY ================= */

function saveToDaily(){
  const d = get("daily");
  d.unshift({
    date: now(),
    name: rpName.value,
    email: rpEmail.value,
    phone: rpPhone.value,
    job: "",
    location: rpLocation.value,
    visa: rpVisa.value,
    followup: "",
    notes: "",
    editing:false
  });
  set("daily", d);

  ["rpName","rpEmail","rpPhone","rpLocation","rpVisa","rpNotes"]
    .forEach(id => document.getElementById(id).value="");

  renderDaily();
}

/* ================= UPDATE HELPERS ================= */

function upd(tab,i,k,v){
  const d=get(tab);
  d[i][k]=v;
  set(tab,d);
}

function updFollowup(tab,i,v){
  const d=get(tab);
  d[i].followup=v;
  set(tab,d);
  scheduleReminder(d[i].name,d[i].phone,v);
}

function toggleEdit(tab,i){
  const d=get(tab);
  d[i].editing=!d[i].editing;
  set(tab,d);
  renderAll();
}

function del(tab,i){
  const d=get(tab);
  d.splice(i,1);
  set(tab,d);
  renderAll();
}

/* ================= ROUTING (AUTO TIMESTAMP) ================= */

function route(from,to,i){
  const record = {
    ...get(from)[i],
    date: now(),       // NEW timestamp on stage change
    editing:false
  };
  const target = get(to);
  target.unshift(record);
  set(to,target);
  renderAll();
}

/* ================= TABLE RENDER ================= */

function cell(tab,i,key,val){
  return `<td>
    <input value="${val||""}" ${get(tab)[i].editing?"":"disabled"}
      oninput="upd('${tab}',${i},'${key}',this.value)">
  </td>`;
}

function row(tab,r,i){
  let actions="";

  if(tab==="daily"){
    actions += `<button onclick="route('daily','submission',${i})">📤</button>`;
  }
  if(tab==="submission"){
    actions += `
      <button onclick="route('submission','interview',${i})">🎤</button>
      <button onclick="route('submission','placement',${i})">💼</button>
      <button onclick="route('submission','start',${i})">🚀</button>`;
  }
  if(tab==="interview"){
    actions += `
      <button onclick="route('interview','placement',${i})">💼</button>
      <button onclick="route('interview','start',${i})">🚀</button>`;
  }
  if(tab==="placement"){
    actions += `<button onclick="route('placement','start',${i})">🚀</button>`;
  }

  return `
  <tr>
    ${cell(tab,i,'date',r.date)}
    ${cell(tab,i,'name',r.name)}
    ${cell(tab,i,'email',r.email)}
    ${cell(tab,i,'phone',r.phone)}
    ${cell(tab,i,'job',r.job)}
    ${cell(tab,i,'location',r.location)}
    ${cell(tab,i,'visa',r.visa)}
    <td>
      <input type="datetime-local" value="${r.followup||""}"
        ${r.editing?"":"disabled"}
        onchange="updFollowup('${tab}',${i},this.value)">
    </td>
    <td>
      <textarea ${r.editing?"":"disabled"}
        oninput="upd('${tab}',${i},'notes',this.value)">${r.notes||""}</textarea>
    </td>
    <td>
      <button onclick="toggleEdit('${tab}',${i})">${r.editing?"💾":"✏️"}</button>
      ${actions}
      <button onclick="del('${tab}',${i})">🗑️</button>
    </td>
  </tr>`;
}

function renderDaily(){
  if(!window.dailyTable) return;
  dailyTable.innerHTML="";
  get("daily").forEach((r,i)=> dailyTable.innerHTML+=row("daily",r,i));
}

function renderStage(tab){
  const el = document.getElementById(tab);
  if(!el) return;

  el.innerHTML = `
  <table class="table">
    <thead>
      <tr>
        <th>Date & Time</th><th>Name</th><th>Email</th><th>Phone</th>
        <th>Job</th><th>Location</th><th>Visa</th>
        <th>Follow-Up</th><th>Notes</th><th>Action</th>
      </tr>
    </thead>
    <tbody>
      ${get(tab).map((r,i)=>row(tab,r,i)).join("")}
    </tbody>
  </table>`;
}

/* ================= HOME – YEARLY MONTH REPORT ================= */

function getMonthlyCounts(tab, year){
  const months = Array(12).fill(0);
  get(tab).forEach(r=>{
    const d = new Date(r.date);
    if(d.getFullYear() === year){
      months[d.getMonth()]++;
    }
  });
  return months;
}

function renderHome(){
  const year = 2026;

  const sub   = getMonthlyCounts("submission", year);
  const int   = getMonthlyCounts("interview", year);
  const place = getMonthlyCounts("placement", year);
  const start = getMonthlyCounts("start", year);

  subCount.innerText   = sub.reduce((a,b)=>a+b,0);
  intCount.innerText   = int.reduce((a,b)=>a+b,0);
  placeCount.innerText = place.reduce((a,b)=>a+b,0);
  startCount.innerText = start.reduce((a,b)=>a+b,0);

  const tbody = document.getElementById("yearlyReportTable");
  if(!tbody) return;

  const months = ["Jan","Feb","Mar","Apr","May","Jun",
                  "Jul","Aug","Sep","Oct","Nov","Dec"];

  tbody.innerHTML="";
  months.forEach((m,i)=>{
    tbody.innerHTML += `
      <tr>
        <td><strong>${m}</strong></td>
        <td>${sub[i]}</td>
        <td>${int[i]}</td>
        <td>${place[i]}</td>
        <td>${start[i]}</td>
      </tr>`;
  });
}

/* ================= INIT ================= */

function renderAll(){
  renderJD();
  renderDaily();
  ["submission","proposal","interview","placement","start"].forEach(renderStage);
  renderHome();
}

window.onload = renderAll;
