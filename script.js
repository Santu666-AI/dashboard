// ================= SUPABASE =================

const SUPABASE_URL = "https://jpmmciputroyyrjmyeya.supabase.co";
const SUPABASE_KEY = "sb_publishable_afZSYp99Z_Xwb5Wl_W7J8g_m7fPHPTE";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const el = id => document.getElementById(id);

// ================= INIT =================

document.addEventListener("DOMContentLoaded", () => {
  switchTab("dashboard", document.querySelector(".nav-link.active"));
});

// ================= TAB SWITCH =================

function switchTab(tabId, ref){

  document.querySelectorAll(".tab").forEach(tab=>{
    tab.classList.remove("active");
  });

  document.getElementById(tabId).classList.add("active");

  document.querySelectorAll(".nav-link").forEach(link=>{
    link.classList.remove("active");
  });

  if(ref) ref.classList.add("active");

  const renderMap = {
    dashboard: renderHome,
    jd: renderJD,
    resume: renderResume,
    daily: renderDaily,
    submission: renderSubmission,
    proposal: renderProposal,
    interview: renderInterview,
    placement: renderPlacement,
    start: renderStart
  };

  if(renderMap[tabId]) renderMap[tabId]();
}

// ================= DASHBOARD =================

async function renderHome(){
  await updateKPIs();
  await calculateMonthly();
}

async function updateKPIs(){

  const sub = await supabaseClient.from("submission").select("*",{count:"exact",head:true});
  const int = await supabaseClient.from("interview").select("*",{count:"exact",head:true});
  const pla = await supabaseClient.from("placement").select("*",{count:"exact",head:true});
  const sta = await supabaseClient.from("start").select("*",{count:"exact",head:true});

  el("subCount").innerText = sub.count || 0;
  el("intCount").innerText = int.count || 0;
  el("placeCount").innerText = pla.count || 0;
  el("startCount").innerText = sta.count || 0;
}

async function calculateMonthly(){

  const months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const year=new Date().getFullYear();

  const sub=await supabaseClient.from("submission").select("date");
  const int=await supabaseClient.from("interview").select("interview_scheduled_on");
  const pla=await supabaseClient.from("placement").select("date");
  const sta=await supabaseClient.from("start").select("start_date");

  let rows="";

  for(let m=0;m<12;m++){

    const subCount=(sub.data||[]).filter(r=>new Date(r.date).getFullYear()===year && new Date(r.date).getMonth()===m).length;
    const intCount=(int.data||[]).filter(r=>r.interview_scheduled_on && new Date(r.interview_scheduled_on).getFullYear()===year && new Date(r.interview_scheduled_on).getMonth()===m).length;
    const placeCount=(pla.data||[]).filter(r=>new Date(r.date).getFullYear()===year && new Date(r.date).getMonth()===m).length;
    const startCount=(sta.data||[]).filter(r=>r.start_date && new Date(r.start_date).getFullYear()===year && new Date(r.start_date).getMonth()===m).length;

    rows+=`<tr>
      <td>${months[m]}</td>
      <td>${subCount}</td>
      <td>${intCount}</td>
      <td>${placeCount}</td>
      <td>${startCount}</td>
    </tr>`;
  }

  el("yearlyReportTable").innerHTML=rows;
}

// ================= JD =================

async function renderJD(){
  const {data}=await supabaseClient.from("jd").select("*").order("id",{ascending:false});
  let html=`<input id="jd_nvr" class="form-control mb-2" placeholder="NVR ID">
  <input id="jd_job" class="form-control mb-2" placeholder="Job Title">
  <input id="jd_client" class="form-control mb-2" placeholder="Client">
  <button class="btn btn-primary mb-3" onclick="addJD()">Add JD</button>
  <table class="table table-bordered"><tr><th>NVR</th><th>Job</th><th>Client</th><th>Status</th><th>Del</th></tr>`;
  data.forEach(r=>{
    html+=`<tr>
      <td>${r.nvr_id||""}</td>
      <td>${r.job||""}</td>
      <td>${r.client||""}</td>
      <td>${r.status||"Active"}</td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteRow('jd',${r.id},renderJD)">X</button></td>
    </tr>`;
  });
  html+="</table>";
  el("jd").innerHTML=html;
}

async function addJD(){
  await supabaseClient.from("jd").insert([{
    nvr_id:el("jd_nvr").value,
    job:el("jd_job").value,
    client:el("jd_client").value,
    status:"Active"
  }]);
  renderJD();
}

// ================= COMMON DELETE =================

async function deleteRow(table,id,callback){
  await supabaseClient.from(table).delete().eq("id",id);
  if(callback) callback();
  updateKPIs();
}
// ================= RESUME =================

function renderResume(){
  el("resume").innerHTML = `
    <textarea id="resume_text" class="form-control mb-2" placeholder="Paste Resume"></textarea>
    <button class="btn btn-primary mb-3" onclick="parseResume()">Parse Resume</button>

    <input id="res_name" class="form-control mb-2" placeholder="Name">
    <input id="res_email" class="form-control mb-2" placeholder="Email">
    <input id="res_phone" class="form-control mb-2" placeholder="Phone">
    <input id="res_location" class="form-control mb-2" placeholder="Location">
    <input id="res_source" class="form-control mb-2" placeholder="Source">
    <input id="res_client" class="form-control mb-2" placeholder="Client">
    <input id="res_job" class="form-control mb-2" placeholder="Active Req">

    <button class="btn btn-success" onclick="saveToDaily()">Save to Daily</button>
  `;
}

function parseResume(){

  const text = el("resume_text").value;

  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if(email) el("res_email").value = email[0];

  const phone = text.match(/(\+1\s?)?(\(?\d{3}\)?[\s\-\.]?\d{3}[\s\-\.]?\d{4})/);
  if(phone) el("res_phone").value = phone[0];

  const address = text.match(/[A-Za-z\s]+,\s?[A-Z]{2}(\s\d{5})?/);
  if(address) el("res_location").value = address[0];

  const lines = text.split("\n").map(l=>l.trim()).filter(l=>l.length>2);
  if(lines.length) el("res_name").value = lines[0];
}

async function saveToDaily(){

  await supabaseClient.from("daily").insert([{
    date:new Date().toISOString(),
    name:el("res_name").value,
    email:el("res_email").value,
    phone:el("res_phone").value,
    job:el("res_job").value,
    client:el("res_client").value,
    source:el("res_source").value,
    location:el("res_location").value,
    visa:"",
    followup:"",
    notes:""
  }]);

  renderDaily();
  updateKPIs();
}

// ================= DAILY =================

async function renderDaily(){

  const {data}=await supabaseClient.from("daily").select("*").order("id",{ascending:false});

  let html=`<table class="table table-bordered">
  <tr>
    <th>Name</th><th>Email</th><th>Phone</th>
    <th>Job</th><th>Client</th><th>Source</th>
    <th>Location</th><th>Visa</th>
    <th>Followup</th><th>Notes</th>
    <th>Actions</th>
  </tr>`;

  data.forEach(r=>{
    html+=`
    <tr>
      <td>${r.name||""}</td>
      <td>${r.email||""}</td>
      <td>${r.phone||""}</td>
      <td contenteditable onblur="updateField('daily',${r.id},'job',this.innerText)">${r.job||""}</td>
      <td contenteditable onblur="updateField('daily',${r.id},'client',this.innerText)">${r.client||""}</td>
      <td contenteditable onblur="updateField('daily',${r.id},'source',this.innerText)">${r.source||""}</td>
      <td>${r.location||""}</td>
      <td contenteditable onblur="updateField('daily',${r.id},'visa',this.innerText)">${r.visa||""}</td>
      <td contenteditable onblur="updateField('daily',${r.id},'followup',this.innerText)">${r.followup||""}</td>
      <td contenteditable onblur="updateField('daily',${r.id},'notes',this.innerText)">${r.notes||""}</td>
      <td>
        <button class="btn btn-primary btn-sm" onclick="copyDailyToSubmission(${r.id})">Sub</button>
        <button class="btn btn-warning btn-sm" onclick="copyDailyToProposal(${r.id})">Prop</button>
        <button class="btn btn-danger btn-sm" onclick="deleteRow('daily',${r.id},renderDaily)">Del</button>
      </td>
    </tr>`;
  });

  html+="</table>";
  el("daily").innerHTML=html;
}

async function updateField(table,id,column,value){
  await supabaseClient.from(table).update({[column]:value}).eq("id",id);
}

// ================= ROUTING =================

async function copyDailyToSubmission(id){

  const {data}=await supabaseClient.from("daily").select("*").eq("id",id).single();

  await supabaseClient.from("submission").insert([{
    date:data.date,
    name:data.name,
    email:data.email,
    phone:data.phone,
    job:data.job,
    client:data.client,
    location:data.location,
    visa:data.visa,
    notes:""
  }]);

  renderSubmission();
  updateKPIs();
}

async function copyDailyToProposal(id){

  const {data}=await supabaseClient.from("daily").select("*").eq("id",id).single();

  await supabaseClient.from("proposal").insert([{
    date:data.date,
    name:data.name,
    email:data.email,
    phone:data.phone,
    job:data.job,
    client:data.client,
    program_name:"",
    location:data.location,
    visa:data.visa,
    notes:""
  }]);

  renderProposal();
}

// ================= SUBMISSION =================

async function renderSubmission(){

  const {data}=await supabaseClient.from("submission").select("*").order("id",{ascending:false});

  let html=`<table class="table table-bordered">
  <tr>
    <th>Name</th><th>Job</th><th>Client</th>
    <th>Notes</th><th>Actions</th>
  </tr>`;

  data.forEach(r=>{
    html+=`
    <tr>
      <td>${r.name||""}</td>
      <td>${r.job||""}</td>
      <td>${r.client||""}</td>
      <td contenteditable onblur="updateField('submission',${r.id},'notes',this.innerText)">${r.notes||""}</td>
      <td>
        <button class="btn btn-info btn-sm" onclick="copySubmissionToInterview(${r.id})">Interview</button>
        <button class="btn btn-success btn-sm" onclick="copySubmissionToPlacement(${r.id})">Place</button>
        <button class="btn btn-warning btn-sm" onclick="copySubmissionToStart(${r.id})">Start</button>
        <button class="btn btn-danger btn-sm" onclick="deleteRow('submission',${r.id},renderSubmission)">Del</button>
      </td>
    </tr>`;
  });

  html+="</table>";
  el("submission").innerHTML=html;
}

// ================= INTERVIEW =================

async function copySubmissionToInterview(id){
  const {data}=await supabaseClient.from("submission").select("*").eq("id",id).single();
  await supabaseClient.from("interview").insert([{...data,interview_scheduled_on:null}]);
  renderInterview();
  updateKPIs();
}

async function renderInterview(){

  const {data}=await supabaseClient.from("interview").select("*").order("id",{ascending:false});

  let html=`<table class="table table-bordered">
  <tr>
    <th>Name</th><th>Job</th><th>Client</th>
    <th>Interview Scheduled On</th><th>Del</th>
  </tr>`;

  data.forEach(r=>{
    html+=`
    <tr>
      <td>${r.name||""}</td>
      <td>${r.job||""}</td>
      <td>${r.client||""}</td>
      <td><input type="date" value="${r.interview_scheduled_on||""}"
          onchange="updateInterviewDate(${r.id},this.value)"></td>
      <td><button class="btn btn-danger btn-sm"
          onclick="deleteRow('interview',${r.id},renderInterview)">X</button></td>
    </tr>`;
  });

  html+="</table>";
  el("interview").innerHTML=html;
}

async function updateInterviewDate(id,value){
  await supabaseClient.from("interview")
    .update({interview_scheduled_on:value})
    .eq("id",id);
  updateKPIs();
}

// ================= PLACEMENT =================

async function copySubmissionToPlacement(id){
  const {data}=await supabaseClient.from("submission").select("*").eq("id",id).single();
  await supabaseClient.from("placement").insert([data]);
  renderPlacement();
  updateKPIs();
}

async function renderPlacement(){

  const {data}=await supabaseClient.from("placement").select("*").order("id",{ascending:false});

  let html=`<table class="table table-bordered">
  <tr><th>Name</th><th>Job</th><th>Client</th><th>Del</th></tr>`;

  data.forEach(r=>{
    html+=`
    <tr>
      <td>${r.name||""}</td>
      <td>${r.job||""}</td>
      <td>${r.client||""}</td>
      <td><button class="btn btn-danger btn-sm"
          onclick="deleteRow('placement',${r.id},renderPlacement)">X</button></td>
    </tr>`;
  });

  html+="</table>";
  el("placement").innerHTML=html;
}

// ================= START =================

async function copySubmissionToStart(id){
  const {data}=await supabaseClient.from("submission").select("*").eq("id",id).single();
  await supabaseClient.from("start").insert([{...data,start_date:null}]);
  renderStart();
  updateKPIs();
}

async function renderStart(){

  const {data}=await supabaseClient.from("start").select("*").order("id",{ascending:false});

  let html=`<table class="table table-bordered">
  <tr>
    <th>Name</th><th>Job</th><th>Client</th>
    <th>Started On</th><th>Del</th>
  </tr>`;

  data.forEach(r=>{
    html+=`
    <tr>
      <td>${r.name||""}</td>
      <td>${r.job||""}</td>
      <td>${r.client||""}</td>
      <td><input type="date" value="${r.start_date||""}"
          onchange="updateStartDate(${r.id},this.value)"></td>
      <td><button class="btn btn-danger btn-sm"
          onclick="deleteRow('start',${r.id},renderStart)">X</button></td>
    </tr>`;
  });

  html+="</table>";
  el("start").innerHTML=html;
}

async function updateStartDate(id,value){
  await supabaseClient.from("start")
    .update({start_date:value})
    .eq("id",id);
  updateKPIs();
}
