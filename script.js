/* ================================
   SUPABASE CONNECTION
================================ */

const SUPABASE_URL = "https://jpmmciputroyyrjmyeya.supabase.co";
const SUPABASE_KEY = "sb_publishable_afZSYp99Z_Xwb5Wl_W7J8g_m7fPHPTE";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


/* ================================
   LOGIN SYSTEM
================================ */

function login(){
  const u = el("username").value.trim();
  const p = el("password").value.trim();

  if(u === "admin" && p === "admin"){
    localStorage.setItem("logged","yes");
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


/* ================================
   HELPERS
================================ */

const el = id => document.getElementById(id);
const now = () => new Date().toISOString();


/* ================================
   SAVE TO DAILY
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
    alert(error.message);
    console.error(error);
    return;
  }

  loadDaily();
}


/* ================================
   LOAD DAILY
================================ */

async function loadDaily(){

  const table = el("dailyTable");
  if(!table) return;

  const { data, error } = await supabaseClient
    .from("daily")
    .select("*")
    .order("id",{ascending:false});

  if(error){
    console.error(error);
    return;
  }

  table.innerHTML = "";

  (data||[]).forEach((r,i)=>{

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
        <button onclick="copyToStage(${r.id},'submission')">Submission</button>
        <button onclick="copyToStage(${r.id},'proposal')">Proposal</button>
        <button onclick="copyToStage(${r.id},'interview')">Interview</button>
        <button onclick="copyToStage(${r.id},'placement')">Placement</button>
        <button onclick="copyToStage(${r.id},'start')">Start</button>
      </td>
    </tr>`;
  });

  updateKPIs();
}


/* ================================
   COPY TO STAGE (NOT MOVE)
================================ */

async function copyToStage(id, target){

  const { data, error } = await supabaseClient
    .from("daily")
    .select("*")
    .eq("id", id)
    .single();

  if(error || !data){
    console.error(error);
    return;
  }

  let row = {
    date: data.date,
    name: data.name,
    email: data.email,
    phone: data.phone,
    job: data.job,
    client: data.client,
    location: data.location,
    visa: data.visa,
    notes: data.notes
  };

  if(target === "proposal"){
    row.program_name = "";
  }

  if(target === "interview"){
    row.interview_scheduled_on = null;
  }

  if(target === "start"){
    row.start_date = null;
  }

  const { error: insertError } = await supabaseClient
    .from(target)
    .insert([row]);

  if(insertError){
    alert(insertError.message);
    console.error(insertError);
    return;
  }

  loadStage(target);
  updateKPIs();
}


/* ================================
   LOAD STAGE TABLES
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

  let extraHeader = "";
  let extraCell = "";

  if(tab === "proposal"){
    extraHeader = "<th>Program</th>";
    extraCell = r => `<td><input type="text" value="${r.program_name||""}" 
                     onchange="updateProposal(${r.id}, this.value)"></td>`;
  }

  if(tab === "interview"){
    extraHeader = "<th>Interview Date</th>";
    extraCell = r => `<td><input type="date" value="${r.interview_scheduled_on||""}" 
                     onchange="updateInterviewDate(${r.id}, this.value)"></td>`;
  }

  if(tab === "start"){
    extraHeader = "<th>Start Date</th>";
    extraCell = r => `<td><input type="date" value="${r.start_date||""}" 
                     onchange="updateStartDate(${r.id}, this.value)"></td>`;
  }

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
        ${extraHeader}
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
            ${extraCell ? extraCell(r) : ""}
            <td>${r.notes||""}</td>
          </tr>
        `).join("")
      }
    </tbody>
  </table>`;
}


/* ================================
   UPDATE FUNCTIONS
================================ */

async function updateProposal(id,value){
  await supabaseClient.from("proposal")
    .update({ program_name:value })
    .eq("id",id);
}

async function updateInterviewDate(id,value){
  await supabaseClient.from("interview")
    .update({ interview_scheduled_on:value })
    .eq("id",id);
}

async function updateStartDate(id,value){
  await supabaseClient.from("start")
    .update({ start_date:value })
    .eq("id",id);
}


/* ================================
   KPI
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
}


/* ================================
   INIT
================================ */

window.addEventListener("load",()=>{

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
