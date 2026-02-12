/* ================================
   SUPABASE CONNECTION
================================ */

const SUPABASE_URL = "https://jpmmciputroyyrjmyeya.supabase.co";
const SUPABASE_KEY = "sb_publishable_afZSYp99Z_Xwb5Wl_W7J8g_m7fPHPTE";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


/* ================================
   LOGIN SYSTEM (WORKS ON GITHUB)
================================ */

function login(){
  const u = document.getElementById("username").value.trim();
  const p = document.getElementById("password").value.trim();

  // 👉 You can change username/password here
  if(u === "admin" && p === "admin"){
    localStorage.setItem("logged","yes");
    window.location.href = "dashboard.html";
  }else{
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


/* ================================
   HELPERS
================================ */

const el = id => document.getElementById(id);
const now = () => new Date().toISOString();


/* ================================
   RESUME PARSER
================================ */

function parseResume(t){
  if(!t || t.length < 10) return;

  const e = t.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if(e && el("rpEmail") && !el("rpEmail").value){
    el("rpEmail").value = e[0];
  }
}


/* ================================
   SAVE TO DAILY (SUPABASE)
================================ */

async function saveToDaily(){

  const row = {
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
  };

  const { error } = await supabaseClient
    .from("daily")
    .insert([row]);

  if(error){
    alert("Supabase Insert Error");
    console.error(error);
    return;
  }

  loadDaily();
}


/* ================================
   LOAD DAILY TABLE
================================ */

async function loadDaily(){

  const table = el("dailyTable");
  if(!table) return;

  const { data, error } = await supabaseClient
    .from("daily")
    .select("*")
    .order("id",{ascending:false});

  if(error){
    console.log(error);
    return;
  }

  table.innerHTML = "";

  data.forEach((r,i)=>{

    table.innerHTML += `
    <tr>
      <td>${i+1}</td>
      <td>${r.date ? r.date.split("T")[0] : ""}</td>
      <td>${r.name||""}</td>
      <td>${r.email||""}</td>
      <td>${r.phone||""}</td>
      <td>${r.job||""}</td>
      <td>${r.client||""}</td>
      <td>${r.source||""}</td>
      <td>${r.location||""}</td>
      <td>${r.visa||""}</td>
      <td>${r.followup||""}</td>
      <td>${r.notes||""}</td>
      <td>
        <button onclick="moveStage(${r.id},'submission')">Submission</button>
        <button onclick="moveStage(${r.id},'proposal')">Proposal</button>
      </td>
    </tr>`;
  });

  updateKPIs();
}


/* ================================
   MOVE BETWEEN STAGES
================================ */

async function moveStage(id,table){

  const { data } = await supabaseClient
    .from("daily")
    .select("*")
    .eq("id",id)
    .single();

  if(!data) return;

  delete data.id;

  await supabaseClient.from(table).insert([data]);

  loadDaily();
  loadStage("submission");
  loadStage("proposal");
}


/* ================================
   LOAD OTHER TABS
================================ */

async function loadStage(tab){

  const container = el(
    tab==="submission" ? "Submission" :
    tab==="proposal" ? "Proposal" :
    tab==="interview" ? "Interview" :
    tab==="placement" ? "Placement" :
    "start"
  );

  if(!container) return;

  const { data } = await supabaseClient
    .from(tab)
    .select("*")
    .order("id",{ascending:false});

  container.innerHTML = `
  <table class="table table-bordered">
    <thead>
      <tr>
        <th>Date</th>
        <th>Name</th>
        <th>Email</th>
        <th>Phone</th>
        <th>Job</th>
        <th>Client</th>
        <th>Notes</th>
      </tr>
    </thead>
    <tbody>
      ${
        (data||[]).map(r=>`
          <tr>
            <td>${r.date?r.date.split("T")[0]:""}</td>
            <td>${r.name||""}</td>
            <td>${r.email||""}</td>
            <td>${r.phone||""}</td>
            <td>${r.job||""}</td>
            <td>${r.client||""}</td>
            <td>${r.notes||""}</td>
          </tr>
        `).join("")
      }
    </tbody>
  </table>`;
}


/* ================================
   KPI + HOME MONTHLY
================================ */

async function updateKPIs(){

  const sub = await supabaseClient.from("submission").select("*");
  const int = await supabaseClient.from("interview").select("*");
  const pla = await supabaseClient.from("placement").select("*");
  const sta = await supabaseClient.from("start").select("*");

  if(el("subCount")) el("subCount").innerText = sub.data?.length || 0;
  if(el("intCount")) el("intCount").innerText = int.data?.length || 0;
  if(el("placeCount")) el("placeCount").innerText = pla.data?.length || 0;
  if(el("startCount")) el("startCount").innerText = sta.data?.length || 0;

  renderHome(sub.data||[],int.data||[],pla.data||[],sta.data||[]);
}


function renderHome(sub,int,pla,sta){

  const tb = el("yearlyReportTable");
  if(!tb) return;

  const year = new Date().getFullYear();
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  tb.innerHTML="";

  const count = (arr,m)=>arr.filter(r=>{
    const d = new Date(r.date);
    return d.getFullYear()===year && d.getMonth()===m;
  }).length;

  months.forEach((m,i)=>{
    tb.innerHTML+=`
    <tr>
      <td><b>${m}</b></td>
      <td>${count(sub,i)}</td>
      <td>${count(int,i)}</td>
      <td>${count(pla,i)}</td>
      <td>${count(sta,i)}</td>
    </tr>`;
  });
}


/* ================================
   INIT DASHBOARD
================================ */

window.addEventListener("load",()=>{

  // only run on dashboard page
  if(el("dailyTable")){
    checkLogin();

    loadDaily();
    loadStage("submission");
    loadStage("proposal");
    loadStage("interview");
    loadStage("placement");
    loadStage("start");
  }
});
