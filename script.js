/* ================================
   SUPABASE CONNECTION
================================ */

const SUPABASE_URL = "https://jpmmciputroyyrjmyeya.supabase.co";
const SUPABASE_KEY = "sb_publishable_afZSYp99Z_Xwb5Wl_W7J8g_m7fPHPTE";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const el = id => document.getElementById(id);
const now = () => new Date().toISOString();


/* ================================
   LOAD ACTIVE JDs
================================ */

async function loadActiveJDs(){

  const { data } = await supabaseClient
    .from("jd")
    .select("*")
    .eq("jdstatus","Active");

  const select = el("dailyJobSelect");
  if(!select) return;

  select.innerHTML = `<option value="">Select Job</option>`;

  (data||[]).forEach(j=>{
    select.innerHTML += `<option value="${j.jdsubject}">${j.jdsubject}</option>`;
  });
}


/* ================================
   SAVE DAILY
================================ */

async function saveToDaily(){

  const row = {
    date: now(),
    name: el("rpName").value,
    email: el("rpEmail").value,
    phone: el("rpPhone").value,
    job: el("dailyJobSelect").value,
    client: el("dailyClientInput").value,
    source: "",
    location: el("rpLocation").value,
    visa: el("rpVisa").value,
    followup: "",
    notes: el("rpNotes").value
  };

  const { error } = await supabaseClient.from("daily").insert([row]);
  if(error){ alert(error.message); return; }

  loadDaily();
}


/* ================================
   COMMON INSERT
================================ */

async function insertToTarget(data,target){

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

  if(target==="proposal") row.program_name="";
  if(target==="interview") row.interview_scheduled_on=null;
  if(target==="start") row.start_date=null;

  await supabaseClient.from(target).insert([row]);
  loadStage(target);
  updateKPIs();
}


/* ================================
   COPY
================================ */

async function copyToStage(id,target){

  const { data } = await supabaseClient
    .from("daily")
    .select("*")
    .eq("id",id)
    .single();

  if(data) insertToTarget(data,target);
}

async function copyBetweenStages(source,id,target){

  const { data } = await supabaseClient
    .from(source)
    .select("*")
    .eq("id",id)
    .single();

  if(data) insertToTarget(data,target);
}


/* ================================
   DELETE
================================ */

async function deleteRow(table,id){
  if(!confirm("Delete entry?")) return;
  await supabaseClient.from(table).delete().eq("id",id);
  if(table==="daily") loadDaily();
  else loadStage(table);
  updateKPIs();
}


/* ================================
   UPDATE DATE
================================ */

async function updateDate(table,id,value){
  await supabaseClient.from(table).update({date:value}).eq("id",id);
}

async function updateNotes(table,id,value){
  await supabaseClient.from(table).update({notes:value}).eq("id",id);
}


/* ================================
   LOAD DAILY
================================ */

async function loadDaily(){

  const { data } = await supabaseClient
    .from("daily")
    .select("*")
    .order("id",{ascending:false});

  const table = el("dailyTable");
  table.innerHTML="";

  (data||[]).forEach((r,i)=>{

    table.innerHTML+=`
    <tr>
      <td>${i+1}</td>
      <td><input type="date" value="${r.date? r.date.split("T")[0]:""}"
          onchange="updateDate('daily',${r.id},this.value)"></td>
      <td>${r.name||""}</td>
      <td>${r.email||""}</td>
      <td>${r.phone||""}</td>
      <td>${r.job||""}</td>
      <td>${r.client||""}</td>
      <td>${r.location||""}</td>
      <td>${r.visa||""}</td>
      <td>
        <textarea onchange="updateNotes('daily',${r.id},this.value)">
          ${r.notes||""}
        </textarea>
      </td>
      <td>
        <button onclick="copyToStage(${r.id},'submission')">Submission</button>
        <button onclick="copyToStage(${r.id},'proposal')">Proposal</button>
        <button onclick="deleteRow('daily',${r.id})">Delete</button>
      </td>
    </tr>`;
  });

  updateKPIs();
}


/* ================================
   LOAD STAGES
================================ */

async function loadStage(tab){

  const { data } = await supabaseClient
    .from(tab)
    .select("*")
    .order("id",{ascending:false});

  const container = el(tab);
  container.innerHTML=`
  <table class="table table-bordered">
    <thead>
      <tr>
        <th>Date</th><th>Name</th><th>Email</th>
        <th>Job</th><th>Client</th>
        <th>Notes</th>
        ${tab==="submission"?"<th>Action</th>":""}
        <th>Delete</th>
      </tr>
    </thead>
    <tbody>
      ${
        (data||[]).map(r=>`
        <tr>
          <td><input type="date"
            value="${r.date? r.date.split("T")[0]:""}"
            onchange="updateDate('${tab}',${r.id},this.value)"></td>
          <td>${r.name||""}</td>
          <td>${r.email||""}</td>
          <td>${r.job||""}</td>
          <td>${r.client||""}</td>
          <td>
            <textarea onchange="updateNotes('${tab}',${r.id},this.value)">
              ${r.notes||""}
            </textarea>
          </td>
          ${
            tab==="submission"
            ? `<td>
                <button onclick="copyBetweenStages('submission',${r.id},'interview')">Interview</button>
                <button onclick="copyBetweenStages('submission',${r.id},'placement')">Placement</button>
                <button onclick="copyBetweenStages('submission',${r.id},'start')">Start</button>
              </td>`
            : ""
          }
          <td><button onclick="deleteRow('${tab}',${r.id})">Delete</button></td>
        </tr>
        `).join("")
      }
    </tbody>
  </table>`;
}


/* ================================
   KPI
================================ */

async function updateKPIs(){

  const sub = await supabaseClient.from("submission").select("*");
  const int = await supabaseClient.from("interview").select("*");
  const pla = await supabaseClient.from("placement").select("*");
  const sta = await supabaseClient.from("start").select("*");

  el("subCount").innerText=sub.data?.length||0;
  el("intCount").innerText=int.data?.length||0;
  el("placeCount").innerText=pla.data?.length||0;
  el("startCount").innerText=sta.data?.length||0;
}


/* ================================
   INIT
================================ */

window.addEventListener("load",()=>{
  loadActiveJDs();
  loadDaily();
  loadStage("submission");
  loadStage("proposal");
  loadStage("interview");
  loadStage("placement");
  loadStage("start");
});
