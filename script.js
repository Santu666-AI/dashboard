/* =========================================================
   VARADACHARI ATS – SUPABASE CLOUD SCRIPT (FINAL VERSION)
========================================================= */

/* ========= SUPABASE CONNECTION ========= */

const SUPABASE_URL = "https://jpmmciputroyyrjmyeya.supabase.co";
const SUPABASE_KEY = "sb_publishable_afZSYp99Z_Xwb5Wl_W7J8g_m7fPHPTE";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

/* ========= HELPERS ========= */

const el = id => document.getElementById(id);
const now = () => new Date().toISOString();

/* ========= LOGIN ========= */

function login(){

  const u = document.getElementById("username")?.value;
  const p = document.getElementById("password")?.value;

  if(u==="admin" && p==="admin"){
    localStorage.setItem("logged","yes");
    location.href="dashboard.html";
  }else{
    alert("Invalid Login");
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

/* ========= RESUME PARSER ========= */

function parseResume(t){
  if(!t || t.length<40) return;
  const e=t.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if(e && !el("rpEmail").value) el("rpEmail").value=e[0];
}

/* ========= SAVE TO DAILY (SUPABASE) ========= */

async function saveToDaily(){

  const payload = {
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
    .insert([payload]);

  if(error){
    console.log(error);
    alert("Error saving");
    return;
  }

  loadDaily();
  loadHome();
}

/* ========= LOAD DAILY TABLE ========= */

async function loadDaily(){

  const { data, error } = await supabaseClient
    .from("daily")
    .select("*")
    .order("id",{ascending:false});

  if(error){
    console.log(error);
    return;
  }

  const t = el("dailyTable");
  if(!t) return;

  t.innerHTML="";

  data.forEach((r,i)=>{
    t.innerHTML+=`
    <tr>
      <td>${i+1}</td>
      <td>${r.date?.split("T")[0]||""}</td>
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
        <button onclick="routeStage(${r.id},'submission')">Submission</button>
        <button onclick="routeStage(${r.id},'proposal')">Proposal</button>
      </td>
    </tr>`;
  });

}

/* ========= ROUTE BETWEEN STAGES ========= */

async function routeStage(id,table){

  const { data } = await supabaseClient
    .from("daily")
    .select("*")
    .eq("id",id)
    .single();

  if(!data) return;

  await supabaseClient
    .from(table)
    .insert([data]);

  loadHome();
}

/* ========= LOAD STAGE TABLES ========= */

async function renderStage(tab){

  const e = el(tab);
  if(!e) return;

  const { data } = await supabaseClient
    .from(tab.toLowerCase())
    .select("*")
    .order("id",{ascending:false});

  e.innerHTML=`
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
      ${data.map(r=>`
        <tr>
          <td>${r.date?.split("T")[0]||""}</td>
          <td>${r.name||""}</td>
          <td>${r.email||""}</td>
          <td>${r.phone||""}</td>
          <td>${r.job||""}</td>
          <td>${r.client||""}</td>
          <td>${r.notes||""}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>`;
}

/* ========= HOME KPI + MONTHLY REPORT ========= */

async function loadHome(){

  const getCount = async tab=>{
    const { count } = await supabaseClient
      .from(tab)
      .select("*",{count:"exact",head:true});
    return count||0;
  };

  el("subCount").innerText = await getCount("submission");
  el("intCount").innerText = await getCount("interview");
  el("placeCount").innerText = await getCount("placement");
  el("startCount").innerText = await getCount("start");

  const months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const tb=el("yearlyReportTable");
  if(!tb) return;

  tb.innerHTML="";

  months.forEach(m=>{
    tb.innerHTML+=`
      <tr>
        <td><b>${m}</b></td>
        <td>0</td>
        <td>0</td>
        <td>0</td>
        <td>0</td>
      </tr>`;
  });
}

/* ========= INIT ========= */

window.onload = async function(){

  if(location.pathname.includes("dashboard")){
    checkLogin();
    loadDaily();
    loadHome();
    renderStage("Submission");
    renderStage("Proposal");
    renderStage("Interview");
    renderStage("Placement");
    renderStage("start");
  }

};
