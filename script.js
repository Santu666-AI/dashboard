/* ================================
   SUPABASE CONFIG
================================ */

const SUPABASE_URL = "https://jpmmciputroyyrjmyeya.supabase.co";
const SUPABASE_KEY = "sb_publishable_afZSYp99Z_Xwb5Wl_W7J8g_m7fPHPTE";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const el = id => document.getElementById(id);
const now = () => new Date().toISOString();

/* ================================
   LOGIN
================================ */

function login(){
  if(el("username").value==="admin" && el("password").value==="admin"){
    localStorage.setItem("logged","yes");
    location.href="dashboard.html";
  } else alert("Invalid Login");
}

function logout(){
  localStorage.removeItem("logged");
  location.href="index.html";
}

function checkLogin(){
  if(localStorage.getItem("logged")!=="yes")
    location.href="index.html";
}

/* ================================
   KPI + MONTHLY
================================ */

async function updateKPIs(){
  const sub = await supabaseClient.from("submission").select("id");
  const int = await supabaseClient.from("interview").select("id");
  const pla = await supabaseClient.from("placement").select("id");
  const sta = await supabaseClient.from("start").select("id");

  el("subCount").innerText = sub.data?.length || 0;
  el("intCount").innerText = int.data?.length || 0;
  el("placeCount").innerText = pla.data?.length || 0;
  el("startCount").innerText = sta.data?.length || 0;

  renderMonthly();
}

async function renderMonthly(){
  const year=new Date().getFullYear();
  const months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const tables=["submission","interview","placement","start"];
  const responses=await Promise.all(tables.map(t=>supabaseClient.from(t).select("date")));
  const tbody=el("yearlyReportTable");
  if(!tbody) return;
  tbody.innerHTML="";
  months.forEach((m,i)=>{
    function count(arr){
      return (arr||[]).filter(r=>{
        if(!r.date) return false;
        const d=new Date(r.date);
        return d.getFullYear()===year && d.getMonth()===i;
      }).length;
    }
    tbody.innerHTML+=`
      <tr>
        <td>${m}</td>
        <td>${count(responses[0].data)}</td>
        <td>${count(responses[1].data)}</td>
        <td>${count(responses[2].data)}</td>
        <td>${count(responses[3].data)}</td>
      </tr>`;
  });
}

async function refreshDashboard(){ await updateKPIs(); }

/* ================================
   TAB SWITCH
================================ */

function switchTab(tabId,ref){
  document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
  document.getElementById(tabId).classList.add("active");
  document.querySelectorAll(".nav-link").forEach(n=>n.classList.remove("active"));
  if(ref) ref.classList.add("active");
  renderTab(tabId);
}

function renderTab(tabId){
  switch(tabId){
    case "resume": renderResume(); break;
    case "daily": renderDaily(); break;
    case "submission": renderSubmission(); break;
    case "proposal": renderProposal(); break;
    case "interview": renderInterview(); break;
    case "placement": renderPlacement(); break;
    case "start": renderStart(); break;
  }
}

async function initDashboard(){
  checkLogin();
  await updateKPIs();
}

/* ================================
   GENERIC UPDATE & DELETE
================================ */

async function updateRow(table,id,data,reload){
  await supabaseClient.from(table).update(data).eq("id",id);
  if(reload) reload();
  refreshDashboard();
}

async function deleteRow(table,id,reload){
  await supabaseClient.from(table).delete().eq("id",id);
  if(reload) reload();
  refreshDashboard();
}

/* ================================
   RESUME (CLIENT + SMART PARSER)
================================ */

async function renderResume(){
  const container=el("resume");
  container.innerHTML=`
    <h5>Resume Entry</h5>

    <label>Job</label>
    <input id="res_job" class="form-control mb-2">

    <label>Client</label>
    <input id="res_client" class="form-control mb-2">

    <label>Name</label>
    <input id="res_name" class="form-control mb-2">

    <label>Email</label>
    <input id="res_email" class="form-control mb-2">

    <label>Phone</label>
    <input id="res_phone" class="form-control mb-2">

    <label>Location</label>
    <input id="res_location" class="form-control mb-2">

    <label>Visa</label>
    <input id="res_visa" class="form-control mb-2">

    <textarea id="resume_text" class="form-control mb-2" rows="4"></textarea>

    <button class="btn btn-secondary mb-2" onclick="parseResume()">Parse</button>
    <button class="btn btn-primary" onclick="saveToDaily()">Save To Daily</button>
  `;
}

function parseResume(){
  const text=el("resume_text").value;

  const email=text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if(email) el("res_email").value=email[0];

  const phone=text.match(/\d{10}/);
  if(phone) el("res_phone").value=phone[0];

  const lines=text.split("\n").filter(l=>l.trim()!=="");
  if(lines.length>0) el("res_name").value=lines[0];

  const loc=text.match(/Location\s*([A-Za-z,\s]+)/i);
  if(loc) el("res_location").value=loc[1].trim();

  const visa=text.match(/Work authorization\s*([A-Za-z\s]+)/i);
  if(visa) el("res_visa").value=visa[1].trim();
}

async function saveToDaily(){
  await supabaseClient.from("daily").insert({
    date:now(),
    name:el("res_name").value,
    email:el("res_email").value,
    phone:el("res_phone").value,
    job:el("res_job").value,
    client:el("res_client").value,
    location:el("res_location").value,
    visa:el("res_visa").value,
    notes:""
  });
}

/* ================================
   DAILY (EDIT/SAVE SYSTEM)
================================ */

async function renderDaily(){
  const container=el("daily");
  container.innerHTML=`
    <h5>Daily</h5>
    <table class="table table-bordered">
      <thead>
        <tr>
          <th>SL</th><th>Name</th><th>Email</th><th>Phone</th>
          <th>Job</th><th>Client</th><th>Visa</th>
          <th>Date</th><th>Notes</th><th>Actions</th>
        </tr>
      </thead>
      <tbody id="dailyBody"></tbody>
    </table>`;
  loadDaily();
}

async function loadDaily(){
  const {data}=await supabaseClient.from("daily").select("*").order("id",{ascending:false});
  const body=el("dailyBody");
  body.innerHTML="";
  data.forEach((r,i)=>{
    body.innerHTML+=`
      <tr id="dailyRow${r.id}">
        <td>${i+1}</td>
        <td>${r.name}</td>
        <td>${r.email||''}</td>
        <td>${r.phone||''}</td>
        <td>${r.job}</td>
        <td>${r.client||''}</td>
        <td>${r.visa||''}</td>
        <td>${r.date.split("T")[0]}</td>
        <td>${r.notes||''}</td>
        <td>
          <button class="btn btn-sm btn-info" onclick="editDaily(${r.id})">Edit</button>
          <button class="btn btn-sm btn-primary" onclick="moveToSubmission(${r.id})">Submission</button>
          <button class="btn btn-sm btn-danger" onclick="deleteRow('daily',${r.id},renderDaily)">X</button>
        </td>
      </tr>`;
  });
}

async function editDaily(id){
  const {data}=await supabaseClient.from("daily").select("*").eq("id",id).single();
  const row=document.getElementById(`dailyRow${id}`);
  row.innerHTML=`
    <td>#</td>
    <td><input id="d_name${id}" value="${data.name}"></td>
    <td><input id="d_email${id}" value="${data.email||''}"></td>
    <td><input id="d_phone${id}" value="${data.phone||''}"></td>
    <td>${data.job}</td>
    <td><input id="d_client${id}" value="${data.client||''}"></td>
    <td><input id="d_visa${id}" value="${data.visa||''}"></td>
    <td><input type="date" id="d_date${id}" value="${data.date.split("T")[0]}"></td>
    <td><textarea id="d_notes${id}">${data.notes||''}</textarea></td>
    <td><button class="btn btn-sm btn-success" onclick="saveDaily(${id})">Save</button></td>`;
}

async function saveDaily(id){
  await updateRow("daily",id,{
    name:el(`d_name${id}`).value,
    email:el(`d_email${id}`).value,
    phone:el(`d_phone${id}`).value,
    client:el(`d_client${id}`).value,
    visa:el(`d_visa${id}`).value,
    date:el(`d_date${id}`).value,
    notes:el(`d_notes${id}`).value
  },renderDaily);
}
