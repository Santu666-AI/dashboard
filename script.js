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

/* ================= STORAGE HELPERS ================= */

const get = k => JSON.parse(localStorage.getItem(k) || "[]");
const set = (k,v) => localStorage.setItem(k, JSON.stringify(v));
const today = () => new Date().toLocaleDateString("en-US");

/* ================= NOTIFICATION ================= */

if ("Notification" in window && Notification.permission !== "granted") {
  Notification.requestPermission();
}

function scheduleReminder(name, phone, datetime){
  if(!datetime) return;
  const notifyAt = new Date(datetime).getTime() - (10 * 60 * 1000);
  const delay = notifyAt - Date.now();

  if(delay > 0){
    setTimeout(()=>{
      new Notification("Follow-up Reminder",{
        body:`Call ${name}${phone ? " – " + phone : ""}`
      });
    }, delay);
  }
}

/* ================= JOB DESCRIPTION ================= */

function saveJD(){
  const d=get("jd");
  d.push({
    date: jdDate.value || today(),
    nvr: jdNvr.value,
    subject: jdSubject.value,
    text: jdText.value
  });
  set("jd",d);
  renderJD();
}

function renderJD(){
  if(!window.jdTable) return;
  jdTable.innerHTML="";
  get("jd").forEach(r=>{
    jdTable.innerHTML+=`
      <tr>
        <td>${r.date}</td>
        <td>${r.nvr}</td>
        <td>${r.subject}</td>
      </tr>`;
  });
}

/* ================= RESUME → DAILY ================= */

function saveToDaily(){
  const txt = rpNotes.value || "";

  const autoEmail = (txt.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)||[""])[0];
  const autoPhone = (txt.match(/(\+?\d{1,3}[\s-]?)?\d{10}/)||[""])[0];
  const autoName  = txt.split("\n").map(l=>l.trim()).filter(Boolean)[0] || "";
  const autoVisa  = (txt.match(/(US Citizen|GC|Green Card|H1B|H-1B|OPT|CPT|EAD|L2|TN)/i)||[""])[0];

  const d=get("daily");
  d.push({
    date: rpDate.value || today(),
    name: rpName.value || autoName,
    email: rpEmail.value || autoEmail,
    phone: rpPhone.value || autoPhone,
    job: "",
    location: rpLocation.value || "",
    skills: rpSkills.value || "",
    visa: rpVisa.value || autoVisa,
    followup: "",
    notes: "",
    editing:false
  });
  set("daily",d);

  rpDate.value="";
  rpName.value="";
  rpEmail.value="";
  rpPhone.value="";
  rpLocation.value="";
  rpSkills.value="";
  rpVisa.value="";
  rpNotes.value="";

  renderAll();
}

/* ================= UPDATE HELPERS ================= */

function upd(tab,i,k,v){
  const d=get(tab);
  d[i][k]=v;
  set(tab,d);
}

function updFollowup(i,v){
  const d=get("daily");
  d[i].followup=v;
  set("daily",d);
  scheduleReminder(d[i].name,d[i].phone,v);
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
  d.push(copy);
  set(to,d);
  renderAll();
}

/* ================= CELL ================= */

function cell(tab,i,key,val){
  return `<td>
    <input value="${val||""}"
      onblur="upd('${tab}',${i},'${key}',this.value)">
  </td>`;
}

/* ================= ROW TEMPLATE ================= */

function row(tab,r,i){
  let actions="";

  if(tab==="daily"){
    actions=`
      <button onclick="route('daily','submission',${i})">Sub</button>
      <button onclick="route('daily','proposal',${i})">Pro</button>`;
  }

  if(tab==="submission"){
    actions=`
      <button onclick="route('submission','interview',${i})">INT</button>
      <button onclick="route('submission','placement',${i})">OFF</button>
      <button onclick="route('submission','start',${i})">STA</button>`;
  }

  if(tab==="interview"){
    actions=`
      <button onclick="route('interview','placement',${i})">OFF</button>
      <button onclick="route('interview','start',${i})">STA</button>`;
  }

  if(tab==="placement"){
    actions=`<button onclick="route('placement','start',${i})">STA</button>`;
  }

  return `
  <tr>
    ${cell(tab,i,'date',r.date)}
    ${cell(tab,i,'name',r.name)}
    ${cell(tab,i,'email',r.email)}
    ${cell(tab,i,'phone',r.phone)}
    ${cell(tab,i,'job',r.job)}
    ${cell(tab,i,'location',r.location)}
    ${cell(tab,i,'skills',r.skills)}
    ${cell(tab,i,'visa',r.visa)}
    <td>
      <input type="datetime-local"
        value="${r.followup||""}"
        onchange="updFollowup(${i},this.value)">
    </td>
    <td>
      <textarea onblur="upd('${tab}',${i},'notes',this.value)">
${r.notes||""}</textarea>
    </td>
    <td>
      ${actions}
      <button onclick="del('${tab}',${i})">DEL</button>
    </td>
  </tr>`;
}

/* ================= DAILY ================= */

function renderDaily(){
  if(!window.dailyTable) return;
  dailyTable.innerHTML="";
  get("daily").forEach((r,i)=>{
    dailyTable.innerHTML+=row("daily",r,i);
  });
}

/* ================= PIPELINE ================= */

function renderStage(tab){
  document.getElementById(tab).innerHTML=`
    <table class="table">
      <thead>
        <tr>
          <th>Date</th><th>Name</th><th>Email</th><th>Phone</th>
          <th>Job</th><th>Location</th><th>Skills</th><th>Visa</th>
          <th>Follow-Up</th><th>Notes</th><th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${get(tab).map((r,i)=>row(tab,r,i)).join("")}
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
  const stats=getMonthlyStats(2026);

  subCount.innerText=stats.reduce((a,b)=>a+b.s,0);
  intCount.innerText=stats.reduce((a,b)=>a+b.i,0);
  placeCount.innerText=stats.reduce((a,b)=>a+b.p,0);
  startCount.innerText=stats.reduce((a,b)=>a+b.t,0);

  if(window.homeChartInstance) window.homeChartInstance.destroy();

  window.homeChartInstance=new Chart(homeChart,{
    type:"bar",
    data:{
      labels:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
      datasets:[
        {label:"Submissions",data:stats.map(x=>x.s)},
        {label:"Interviews",data:stats.map(x=>x.i)},
        {label:"Placements",data:stats.map(x=>x.p)},
        {label:"Starts",data:stats.map(x=>x.t)}
      ]
    },
    options:{responsive:true}
  });
}

/* ================= INIT ================= */

function renderAll(){
  renderJD();
  renderDaily();
  ["submission","proposal","interview","placement","start"].forEach(renderStage);
  renderHome();
}

window.onload=renderAll;
