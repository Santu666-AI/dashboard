/* ================= LOGIN ================= */

function login(){
  if(username.value==="admin" && password.value==="admin"){
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
const today = () => new Date().toLocaleDateString("en-US");

/* ================= NOTIFICATION ================= */

if("Notification" in window && Notification.permission!=="granted"){
  Notification.requestPermission();
}

function scheduleReminder(name, phone, datetime){
  if(!datetime) return;
  const notifyAt = new Date(datetime).getTime() - 10*60*1000;
  const delay = notifyAt - Date.now();
  if(delay > 0){
    setTimeout(()=>{
      new Notification("Follow-up Reminder",{
        body:`Call ${name}${phone ? " – "+phone : ""}`
      });
    }, delay);
  }
}

/* ================= JD ================= */

function saveJD(){
  const d=get("jd");
  d.unshift({
    date: jdDate.value || today(),
    nvr: jdNvr.value,
    subject: jdSubject.value,
    text: jdText.value,
    status: "Active"
  });
  set("jd",d);
  renderJD();
}

function renderJD(){
  jdTable.innerHTML="";
  get("jd").forEach((r,i)=>{
    jdTable.innerHTML+=`
    <tr>
      <td>${r.date}</td>
      <td>${r.nvr}</td>
      <td>
        <a href="#" onclick="openJD(${i})">${r.subject}</a>
      </td>
      <td>
        <select onchange="upd('jd',${i},'status',this.value)">
          ${["Active","Hold","Closed"].map(s =>
            `<option ${r.status===s?"selected":""}>${s}</option>`
          ).join("")}
        </select>
      </td>
    </tr>`;
  });
}

function openJD(i){
  const r=get("jd")[i];
  jdModalTitle.innerText=r.subject;
  jdModalBody.innerText=r.text || "";
  new bootstrap.Modal(document.getElementById("jdModal")).show();
}

/* ================= RESUME → DAILY ================= */

function saveToDaily(){
  const d=get("daily");
  d.unshift({
    date: rpDate.value || today(),
    name: rpName.value,
    email: rpEmail.value,
    phone: rpPhone.value,
    job: "",
    location: rpLocation.value,
    visa: rpVisa.value,
    notes: "",
    followup: "",
    editing:false
  });
  set("daily",d);

  ["rpDate","rpName","rpEmail","rpPhone","rpLocation","rpVisa","rpNotes"]
    .forEach(id=>document.getElementById(id).value="");

  renderDaily();
}

/* ================= UPDATE / DELETE ================= */

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

/* ================= ROUTING (ADD ONLY) ================= */

function route(from,to,i){
  const copy={...get(from)[i],editing:false};
  const d=get(to);
  d.unshift(copy);
  set(to,d);
  renderAll();
}

/* ================= TABLE CELL ================= */

function cell(tab,i,key,val){
  return `<td>
    <input value="${val||""}"
      ${get(tab)[i].editing?"":"disabled"}
      oninput="upd('${tab}',${i},'${key}',this.value)">
  </td>`;
}

/* ================= ROW (WITH NAMED ICON ACTIONS) ================= */

function row(tab,r,i){
  let actions="";

  /* DAILY → SUBMISSION / PROPOSAL */
  if(tab==="daily"){
    actions+=`
      <button title="Submit Candidate"
        onclick="route('daily','submission',${i})">📤</button>
    `;
  }

  /* SUBMISSION → INTERVIEW / OFFER / START */
  if(tab==="submission"){
    actions+=`
      <button title="Move to Interview"
        onclick="route('submission','interview',${i})">🎤</button>
      <button title="Offer / Placement"
        onclick="route('submission','placement',${i})">💼</button>
      <button title="Candidate Start"
        onclick="route('submission','start',${i})">🚀</button>
    `;
  }

  /* INTERVIEW → OFFER / START */
  if(tab==="interview"){
    actions+=`
      <button title="Offer / Placement"
        onclick="route('interview','placement',${i})">💼</button>
      <button title="Candidate Start"
        onclick="route('interview','start',${i})">🚀</button>
    `;
  }

  /* PLACEMENT → START */
  if(tab==="placement"){
    actions+=`
      <button title="Candidate Start"
        onclick="route('placement','start',${i})">🚀</button>
    `;
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
      <input type="datetime-local"
        value="${r.followup||""}"
        ${r.editing?"":"disabled"}
        onchange="updFollowup('${tab}',${i},this.value)">
    </td>
    <td>
      <textarea ${r.editing?"":"disabled"}
        oninput="upd('${tab}',${i},'notes',this.value)">
${r.notes||""}</textarea>
    </td>
    <td>
      <button title="Edit"
        onclick="toggleEdit('${tab}',${i})">
        ${r.editing ? "💾" : "✏️"}
      </button>
      ${actions}
      <button title="Delete"
        onclick="del('${tab}',${i})">🗑️</button>
    </td>
  </tr>`;
}

/* ================= SEARCH + RENDER ================= */

function renderDaily(){
  dailyTable.innerHTML="";
  get("daily").forEach((r,i)=>{
    dailyTable.innerHTML+=row("daily",r,i);
  });
}

function searchDaily(q){
  q=q.toLowerCase();
  dailyTable.innerHTML="";
  get("daily").forEach((r,i)=>{
    if(!q || r.email.toLowerCase().includes(q) || r.phone.includes(q)){
      dailyTable.innerHTML+=row("daily",r,i);
    }
  });
}

function searchSubmission(q){
  q=q.toLowerCase();
  document.getElementById("submission").innerHTML=renderStageHTML("submission",q);
}

function renderStage(tab){
  document.getElementById(tab).innerHTML=renderStageHTML(tab,"");
}

function renderStageHTML(tab,q){
  return `
  <table class="table">
    <thead>
      <tr>
        <th>Date</th><th>Name</th><th>Email</th><th>Phone</th>
        <th>Job</th><th>Location</th><th>Visa</th>
        <th>Follow-Up</th><th>Notes</th><th>Action</th>
      </tr>
    </thead>
    <tbody>
      ${get(tab).map((r,i)=>{
        if(q && !r.email.toLowerCase().includes(q) && !r.phone.includes(q)) return "";
        return row(tab,r,i);
      }).join("")}
    </tbody>
  </table>`;
}

/* ================= HOME ================= */

function getMonthlyStats(year){
  const m=Array.from({length:12},()=>({s:0,i:0,p:0,t:0}));
  [["submission","s"],["interview","i"],["placement","p"],["start","t"]]
    .forEach(([k,x])=>{
      get(k).forEach(r=>{
        const d=new Date(r.date);
        if(d.getFullYear()===year) m[d.getMonth()][x]++;
      });
    });
  return m;
}

function renderHome(){
  const s=getMonthlyStats(2026);
  subCount.innerText=s.reduce((a,b)=>a+b.s,0);
  intCount.innerText=s.reduce((a,b)=>a+b.i,0);
  placeCount.innerText=s.reduce((a,b)=>a+b.p,0);
  startCount.innerText=s.reduce((a,b)=>a+b.t,0);

  if(window.homeChartInstance) homeChartInstance.destroy();

  homeChartInstance=new Chart(homeChart,{
    type:"bar",
    data:{
      labels:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
      datasets:[
        {label:"Submissions",data:s.map(x=>x.s)},
        {label:"Interviews",data:s.map(x=>x.i)},
        {label:"Placements",data:s.map(x=>x.p)},
        {label:"Starts",data:s.map(x=>x.t)}
      ]
    },
    options:{responsive:true}
  });
}

/* ================= INIT ================= */

function renderAll(){
  renderJD();
  renderDaily();
  ["submission","proposal","interview","placement","start"]
    .forEach(renderStage);
  renderHome();
}

window.onload=renderAll;
