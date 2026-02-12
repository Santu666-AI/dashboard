/* ==========================================================
   SUPABASE CONNECTION
========================================================== */

const SUPABASE_URL = "https://jpmmciputroyyrjmyeya.supabase.co";
const SUPABASE_KEY = "sb_publishable_afZSYp99Z_Xwb5Wl_W7J8g_m7fPHPTE";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const el = id => document.getElementById(id);
const now = () => new Date().toISOString();



/* ==========================================================
   LOGIN SYSTEM
========================================================== */

function login(){
  const u = el("username")?.value.trim();
  const p = el("password")?.value.trim();

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



/* ==========================================================
   JD MANAGEMENT
========================================================== */

async function saveJD(){

  const row = {
    date: now(),
    jdnvr: el("jdNvr").value,
    jdsubject: el("jdSubject").value,
    jdtext: el("jdText").value,
    jdstatus: el("jdStatus").value
  };

  const { error } = await supabaseClient.from("jd").insert([row]);

  if(error){
    alert(error.message);
    return;
  }

  el("jdNvr").value="";
  el("jdSubject").value="";
  el("jdText").value="";

  loadJD();
  loadActiveJDs();
}

async function loadJD(){

  const table = el("jdTable");
  if(!table) return;

  const { data } = await supabaseClient
    .from("jd")
    .select("*")
    .order("id",{ascending:false});

  table.innerHTML="";

  (data||[]).forEach(j=>{
    table.innerHTML+=`
      <tr>
        <td>${j.date ? j.date.split("T")[0]:""}</td>
        <td>${j.jdnvr||""}</td>
        <td>${j.jdsubject||""}</td>
        <td>${j.jdstatus||""}</td>
        <td>
          <button class="btn btn-sm btn-danger"
            onclick="deleteRow('jd',${j.id})">Delete</button>
        </td>
      </tr>
    `;
  });
}

async function loadActiveJDs(){

  const { data } = await supabaseClient
    .from("jd")
    .select("jdsubject")
    .eq("jdstatus","Active");

  const select = el("dailyJobSelect");
  if(!select) return;

  select.innerHTML = `<option value="">Select Active Requirement</option>`;

  (data||[]).forEach(j=>{
    select.innerHTML+=`
      <option value="${j.jdsubject}">
        ${j.jdsubject}
      </option>`;
  });
}



/* ==========================================================
   CLIENT SUGGESTION (Manual + Hint)
========================================================== */

async function loadClients(){

  const { data } = await supabaseClient
    .from("clients")
    .select("*")
    .order("client_name");

  const input = el("dailyClientInput");
  if(!input) return;

  input.setAttribute("list","clientList");

  let datalist = document.getElementById("clientList");
  if(!datalist){
    datalist = document.createElement("datalist");
    datalist.id="clientList";
    document.body.appendChild(datalist);
  }

  datalist.innerHTML="";

  (data||[]).forEach(c=>{
    datalist.innerHTML+=`<option value="${c.client_name}">`;
  });
}



/* ==========================================================
   RESUME PARSER
========================================================== */

function parseResume(text){

  if(!text) return;

  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if(emailMatch) el("rpEmail").value = emailMatch[0];

  const phoneMatch = text.match(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/);
  if(phoneMatch) el("rpPhone").value = phoneMatch[0];
}



/* ==========================================================
   SAVE TO DAILY (AUTO CLEAR RESUME)
========================================================== */

async function saveToDaily(){

  if(!el("dailyJobSelect").value)
    return alert("Select Active Requirement");

  const row = {
    date: now(),
    name: el("rpName").value,
    email: el("rpEmail").value,
    phone: el("rpPhone").value,
    job: el("dailyJobSelect").value,
    client: el("dailyClientInput").value,
    location: el("rpLocation").value,
    visa: el("rpVisa").value,
    notes: el("rpNotes").value
  };

  const { error } = await supabaseClient.from("daily").insert([row]);

  if(error){
    alert(error.message);
    return;
  }

  /* CLEAR RESUME FORM */
  el("rpName").value="";
  el("rpEmail").value="";
  el("rpPhone").value="";
  el("rpLocation").value="";
  el("rpVisa").value="";
  el("rpNotes").value="";
  el("dailyJobSelect").value="";
  el("dailyClientInput").value="";

  loadDaily();
}



/* ==========================================================
   COPY PIPELINE
========================================================== */

async function copyToStage(id,target){

  const { data } = await supabaseClient
    .from("daily")
    .select("*")
    .eq("id",id)
    .single();

  if(!data) return;

  delete data.id;

  await supabaseClient.from(target).insert([data]);

  loadStage(target);
  updateKPIs();
}

async function copyBetweenStages(source,id,target){

  const { data } = await supabaseClient
    .from(source)
    .select("*")
    .eq("id",id)
    .single();

  if(!data) return;

  delete data.id;

  await supabaseClient.from(target).insert([data]);

  loadStage(target);
  updateKPIs();
}



/* ==========================================================
   DELETE
========================================================== */

async function deleteRow(table,id){

  if(!confirm("Delete entry?")) return;

  await supabaseClient.from(table).delete().eq("id",id);

  if(table==="daily") loadDaily();
  else if(table==="jd"){
    loadJD();
    loadActiveJDs();
  }
  else loadStage(table);

  updateKPIs();
}



/* ==========================================================
   UPDATE NOTES
========================================================== */

async function updateNotes(table,id,value){
  await supabaseClient.from(table)
    .update({notes:value})
    .eq("id",id);
}



/* ==========================================================
   LOAD DAILY (DATE DISPLAY ONLY)
========================================================== */

async function loadDaily(){

  const table = el("dailyTable");
  if(!table) return;

  const { data } = await supabaseClient
    .from("daily")
    .select("*")
    .order("id",{ascending:false});

  table.innerHTML="";

  (data||[]).forEach((r,i)=>{

    table.innerHTML+=`
      <tr>
        <td>${i+1}</td>
        <td>${r.date ? r.date.split("T")[0]:""}</td>
        <td>${r.name||""}</td>
        <td>${r.email||""}</td>
        <td>${r.phone||""}</td>
        <td>${r.job||""}</td>
        <td>${r.client||""}</td>
        <td>${r.location||""}</td>
        <td>${r.visa||""}</td>
        <td>
          <textarea class="form-control"
            onchange="updateNotes('daily',${r.id},this.value)">
            ${r.notes||""}
          </textarea>
        </td>
        <td>
          <button class="btn btn-sm btn-primary"
            onclick="copyToStage(${r.id},'submission')">Submission</button>
          <button class="btn btn-sm btn-warning"
            onclick="copyToStage(${r.id},'proposal')">Proposal</button>
          <button class="btn btn-sm btn-danger"
            onclick="deleteRow('daily',${r.id})">Delete</button>
        </td>
      </tr>
    `;
  });

  updateKPIs();
}



/* ==========================================================
   LOAD STAGES (DATE EDITABLE)
========================================================== */

async function loadStage(tab){

  const container = el(tab);
  if(!container) return;

  const { data } = await supabaseClient
    .from(tab)
    .select("*")
    .order("id",{ascending:false});

  container.innerHTML=`
    <table class="table table-bordered">
      <thead>
        <tr>
          <th>Date</th>
          <th>Name</th>
          <th>Email</th>
          <th>Job</th>
          <th>Client</th>
          <th>Notes</th>
          ${tab==="submission" ? "<th>Move</th>" : ""}
          <th>Delete</th>
        </tr>
      </thead>
      <tbody>
        ${(data||[]).map(r=>`
          <tr>
            <td>
              <input type="date"
                value="${r.date? r.date.split("T")[0]:""}"
                onchange="supabaseClient.from('${tab}')
                  .update({date:this.value})
                  .eq('id',${r.id})">
            </td>
            <td>${r.name||""}</td>
            <td>${r.email||""}</td>
            <td>${r.job||""}</td>
            <td>${r.client||""}</td>
            <td>
              <textarea class="form-control"
                onchange="updateNotes('${tab}',${r.id},this.value)">
                ${r.notes||""}
              </textarea>
            </td>
            ${tab==="submission" ? `
              <td>
                <button class="btn btn-sm btn-info"
                  onclick="copyBetweenStages('submission',${r.id},'interview')">Interview</button>
                <button class="btn btn-sm btn-success"
                  onclick="copyBetweenStages('submission',${r.id},'placement')">Placement</button>
                <button class="btn btn-sm btn-dark"
                  onclick="copyBetweenStages('submission',${r.id},'start')">Start</button>
              </td>` : ""}
            <td>
              <button class="btn btn-sm btn-danger"
                onclick="deleteRow('${tab}',${r.id})">Delete</button>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}



/* ==========================================================
   HOME MONTHLY REPORT
========================================================== */

async function renderHome(){

  const table = el("yearlyReportTable");
  if(!table) return;

  const year = new Date().getFullYear();
  const months=["Jan","Feb","Mar","Apr","May","Jun",
                "Jul","Aug","Sep","Oct","Nov","Dec"];

  const [sub,int,pla,sta] = await Promise.all([
    supabaseClient.from("submission").select("date"),
    supabaseClient.from("interview").select("date"),
    supabaseClient.from("placement").select("date"),
    supabaseClient.from("start").select("date")
  ]);

  function count(arr,i){
    return (arr||[]).filter(r=>{
      if(!r.date) return false;
      const d=new Date(r.date);
      return d.getFullYear()===year && d.getMonth()===i;
    }).length;
  }

  table.innerHTML="";

  months.forEach((m,i)=>{
    table.innerHTML+=`
      <tr>
        <td><b>${m}</b></td>
        <td>${count(sub.data,i)}</td>
        <td>${count(int.data,i)}</td>
        <td>${count(pla.data,i)}</td>
        <td>${count(sta.data,i)}</td>
      </tr>
    `;
  });
}



/* ==========================================================
   KPI
========================================================== */

async function updateKPIs(){

  const sub = await supabaseClient.from("submission").select("*");
  const int = await supabaseClient.from("interview").select("*");
  const pla = await supabaseClient.from("placement").select("*");
  const sta = await supabaseClient.from("start").select("*");

  el("subCount").innerText = sub.data?.length || 0;
  el("intCount").innerText = int.data?.length || 0;
  el("placeCount").innerText = pla.data?.length || 0;
  el("startCount").innerText = sta.data?.length || 0;

  renderHome();
}



/* ==========================================================
   INIT
========================================================== */

window.addEventListener("load",()=>{

  if(el("dailyTable")){

    checkLogin();

    loadJD();
    loadActiveJDs();
    loadClients();

    loadDaily();
    loadStage("submission");
    loadStage("proposal");
    loadStage("interview");
    loadStage("placement");
    loadStage("start");

    renderHome();
  }
});
