/* =========================================================
   NETVISION ATS – PRODUCTION MASTER BUILD
   Full Workflow | GitHub Safe | Session Stable
========================================================= */

const SUPABASE_URL = "https://ftxrrgdmkpnghxilnpsk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_8_jiydwm4YMDg3Nuf9T0xg_1S_jMGpc";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun",
                "Jul","Aug","Sep","Oct","Nov","Dec"];

/* ================= AUTH ================= */

async function checkAuth(){
  const { data:{user} } = await supabase.auth.getUser();
  if(!user){
    window.location = "index.html";
  }
}

async function logout(){
  await supabase.auth.signOut();
  window.location = "index.html";
}

/* ================= UTIL ================= */

function today(){
  return new Date().toISOString().split("T")[0];
}

function switchTab(id){
  document.querySelectorAll(".section").forEach(s=>s.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  document.querySelectorAll(".sidebar a").forEach(a=>a.classList.remove("active-link"));
  event.target.classList.add("active-link");
}

/* ================= JD SYSTEM ================= */

async function addJD(){
  if(!jdNvr.value || !jdTitle.value) return;

  await supabase.from("jd").insert([{
    date: jdDate.value || today(),
    nvr: jdNvr.value.trim(),
    title: jdTitle.value.trim(),
    client: jdClient.value.trim(),
    status: jdStatus.value
  }]);

  jdNvr.value="";
  jdTitle.value="";
  jdClient.value="";

  loadJD();
}

async function updateJDStatus(id,val){
  await supabase.from("jd")
    .update({status:val})
    .eq("id",id);
  loadJD();
}

async function deleteJD(id){
  await supabase.from("jd")
    .delete()
    .eq("id",id);
  loadJD();
}

async function loadJD(){

  const { data } = await supabase
    .from("jd")
    .select("*")
    .order("date",{ascending:false});

  jdBody.innerHTML="";

  data?.forEach((r,i)=>{
    jdBody.innerHTML+=`
      <tr>
        <td>${i+1}</td>
        <td>${r.date||""}</td>
        <td>${r.nvr||""}</td>
        <td>${r.title||""}</td>
        <td>${r.client||""}</td>
        <td>
          <select onchange="updateJDStatus('${r.id}',this.value)">
            <option ${r.status==="Active"?"selected":""}>Active</option>
            <option ${r.status==="Hold"?"selected":""}>Hold</option>
            <option ${r.status==="Closed"?"selected":""}>Closed</option>
          </select>
        </td>
        <td>
          <button onclick="deleteJD('${r.id}')">Delete</button>
        </td>
      </tr>`;
  });

  loadActiveRequirements();
}

async function loadActiveRequirements(){

  const { data } = await supabase
    .from("jd")
    .select("*")
    .eq("status","Active");

  dailyRequirement.innerHTML='<option value="">Select Requirement</option>';

  data?.forEach(j=>{
    dailyRequirement.innerHTML+=
      `<option value="${j.nvr}">${j.nvr} - ${j.title}</option>`;
  });
}

async function autoFillClient(){

  const req = dailyRequirement.value;

  if(!req) return;

  const { data } = await supabase
    .from("jd")
    .select("*")
    .eq("nvr",req)
    .single();

  dailyClient.value = data ? data.client : "";
}

/* ================= RESUME PARSER ================= */

function parseResume(){

  const txt = resumeText.value.trim();
  if(!txt) return;

  const email = txt.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phone = txt.match(/\+?\d[\d\-\s]{8,}/);

  const lines = txt.split("\n")
                   .map(x=>x.trim())
                   .filter(Boolean);

  dailyName.value = lines[0] || "";
  dailyEmail.value = email ? email[0] : "";
  dailyPhone.value = phone ? phone[0] : "";
  dailyLocation.value = lines.find(l=>l.includes(",")) || "";
}

/* ================= DAILY SYSTEM ================= */

async function saveDaily(){

  if(!dailyName.value || !dailyRequirement.value) return;

  await supabase.from("daily").insert([{
    entry_date: today(),
    name: dailyName.value,
    email: dailyEmail.value,
    phone: dailyPhone.value,
    requirement: dailyRequirement.value,
    client: dailyClient.value,
    source: dailySource.value,
    location: dailyLocation.value,
    visa: dailyVisa.value,
    notes: dailyNotes.value
  }]);

  clearDaily();
  loadDaily();
}

function clearDaily(){
  dailyName.value="";
  dailyEmail.value="";
  dailyPhone.value="";
  dailyRequirement.value="";
  dailyClient.value="";
  dailyLocation.value="";
  dailyVisa.value="US Citizen";
  dailyNotes.value="";
  resumeText.value="";
}

async function updateNote(table,id,val){
  await supabase.from(table)
    .update({notes:val})
    .eq("id",id);
}

async function deleteRecord(table,id){
  await supabase.from(table)
    .delete()
    .eq("id",id);
  loadAll();
}

async function loadDaily(){

  const { data } = await supabase
    .from("daily")
    .select("*")
    .order("entry_date",{ascending:false});

  dailyBody.innerHTML="";

  data?.forEach((r,i)=>{
    dailyBody.innerHTML+=`
      <tr>
        <td>${i+1}</td>
        <td>${r.entry_date||""}</td>
        <td>${r.name||""}</td>
        <td>${r.email||""}</td>
        <td>${r.phone||""}</td>
        <td>${r.requirement||""}</td>
        <td>${r.client||""}</td>
        <td>${r.source||""}</td>
        <td>${r.location||""}</td>
        <td>${r.visa||""}</td>
        <td>
          <input value="${r.notes||""}"
            onchange="updateNote('daily','${r.id}',this.value)">
        </td>
        <td>
          <button onclick="moveToSubmission('${r.id}')">Sub</button>
          <button onclick="moveToProposal('${r.id}')">Proposal</button>
          <button onclick="deleteRecord('daily','${r.id}')">Del</button>
        </td>
      </tr>`;
  });
}
/* ================= COPY CHAIN SYSTEM ================= */

async function moveToSubmission(id){

  const { data } = await supabase
    .from("daily")
    .select("*")
    .eq("id",id)
    .single();

  const payload = {...data};
  delete payload.id;
  payload.submission_date = today();

  await supabase.from("submission").insert([payload]);

  loadAll();
}

async function moveToProposal(id){

  const { data } = await supabase
    .from("daily")
    .select("*")
    .eq("id",id)
    .single();

  const payload = {...data};
  delete payload.id;
  payload.proposal_date = today();

  await supabase.from("proposal").insert([payload]);

  loadAll();
}

async function moveToInterview(id){

  const { data } = await supabase
    .from("submission")
    .select("*")
    .eq("id",id)
    .single();

  const payload = {...data};
  delete payload.id;
  payload.interview_scheduled_on = today();

  await supabase.from("interview").insert([payload]);

  loadAll();
}

async function moveToPlacement(id){

  const { data } = await supabase
    .from("interview")
    .select("*")
    .eq("id",id)
    .single();

  const payload = {...data};
  delete payload.id;
  payload.placement_date = today();

  await supabase.from("placement").insert([payload]);

  loadAll();
}

async function moveToStart(id){

  const { data } = await supabase
    .from("placement")
    .select("*")
    .eq("id",id)
    .single();

  const payload = {...data};
  delete payload.id;
  payload.start_date = today();

  await supabase.from("start").insert([payload]);

  loadAll();
}

/* ================= STAGE DATE UPDATE ================= */

async function updateStageDate(stage,id,val){

  let field="";
  if(stage==="submission") field="submission_date";
  if(stage==="proposal") field="proposal_date";
  if(stage==="interview") field="interview_scheduled_on";
  if(stage==="placement") field="placement_date";
  if(stage==="start") field="start_date";

  await supabase.from(stage)
    .update({[field]:val})
    .eq("id",id);

  loadAll();
}

/* ================= GENERIC STAGE RENDER ================= */

async function renderStage(stage, bodyId){

  const body = document.getElementById(bodyId);
  if(!body) return;

  const dateFieldMap = {
    submission:"submission_date",
    proposal:"proposal_date",
    interview:"interview_scheduled_on",
    placement:"placement_date",
    start:"start_date"
  };

  const { data } = await supabase
    .from(stage)
    .select("*")
    .order(dateFieldMap[stage],{ascending:false});

  body.innerHTML="";

  data?.forEach((r,i)=>{

    let action="";

    if(stage==="submission")
      action=`<button onclick="moveToInterview('${r.id}')">Interview</button>`;

    if(stage==="interview")
      action=`<button onclick="moveToPlacement('${r.id}')">Placement</button>`;

    if(stage==="placement")
      action=`<button onclick="moveToStart('${r.id}')">Start</button>`;

    body.innerHTML+=`
      <tr>
        <td>${i+1}</td>
        <td>
          <input type="date"
            value="${r[dateFieldMap[stage]]||""}"
            onchange="updateStageDate('${stage}','${r.id}',this.value)">
        </td>
        <td>${r.name||""}</td>
        <td>${r.client||""}</td>
        <td>${r.requirement||""}</td>
        <td>
          <input value="${r.notes||""}"
            onchange="updateNote('${stage}','${r.id}',this.value)">
        </td>
        <td>
          ${action}
          <button onclick="deleteRecord('${stage}','${r.id}')">Del</button>
        </td>
      </tr>`;
  });
}

/* ================= KPI SYSTEM ================= */

async function renderKPI(){

  const { data:sub } = await supabase.from("submission").select("*");
  const { data:int } = await supabase.from("interview").select("*");
  const { data:place } = await supabase.from("placement").select("*");
  const { data:start } = await supabase.from("start").select("*");

  kpiSub.innerText = sub?.length || 0;
  kpiInt.innerText = int?.length || 0;
  kpiPlace.innerText = place?.length || 0;
  kpiStart.innerText = start?.length || 0;

  monthlyBody.innerHTML="";

  for(let m=0;m<12;m++){

    const subCount = sub?.filter(r=>r.submission_date && new Date(r.submission_date).getMonth()===m).length || 0;
    const intCount = int?.filter(r=>r.interview_scheduled_on && new Date(r.interview_scheduled_on).getMonth()===m).length || 0;
    const placeCount = place?.filter(r=>r.placement_date && new Date(r.placement_date).getMonth()===m).length || 0;
    const startCount = start?.filter(r=>r.start_date && new Date(r.start_date).getMonth()===m).length || 0;

    monthlyBody.innerHTML+=`
      <tr>
        <td>${MONTHS[m]}</td>
        <td>${subCount}</td>
        <td>${intCount}</td>
        <td>${placeCount}</td>
        <td>${startCount}</td>
      </tr>`;
  }
}

/* ================= TASK SYSTEM ================= */

async function addTask(){

  if(!taskTitle.value || !taskDue.value) return;

  await supabase.from("tasks").insert([{
    title: taskTitle.value,
    due: taskDue.value,
    status: "pending"
  }]);

  taskTitle.value="";
  taskDue.value="";

  loadTasks();
}

async function updateTask(id,status){

  if(status==="delete"){
    await supabase.from("tasks").delete().eq("id",id);
  }else{
    await supabase.from("tasks").update({status}).eq("id",id);
  }

  loadTasks();
}

async function loadTasks(){

  const { data } = await supabase
    .from("tasks")
    .select("*")
    .order("due",{ascending:true});

  taskList.innerHTML="";

  data?.forEach(t=>{

    taskList.innerHTML+=`
      <div class="task">
        <strong>${t.title}</strong>
        <small>Due: ${t.due}</small>
        <div>
          ${t.status==="pending"
            ? `<button onclick="updateTask('${t.id}','done')">Done</button>`
            : ""}
          <button onclick="updateTask('${t.id}','delete')">Delete</button>
        </div>
      </div>`;
  });
}

/* ================= MEETING SYSTEM ================= */

async function addMeeting(){

  if(!meetingDate.value || !meetingTitle.value) return;

  await supabase.from("meetings").insert([{
    date: meetingDate.value,
    title: meetingTitle.value,
    notes: meetingNotes.value
  }]);

  meetingDate.value="";
  meetingTitle.value="";
  meetingNotes.value="";

  loadMeetings();
}

async function loadMeetings(){

  const { data } = await supabase
    .from("meetings")
    .select("*")
    .order("date",{ascending:false});

  meetingList.innerHTML="";

  data?.forEach(m=>{
    meetingList.innerHTML+=`
      <div class="meeting">
        <strong>${m.title}</strong>
        <small>${m.date}</small>
        <p>${m.notes||""}</p>
      </div>`;
  });
}

/* ================= HOURLY REMINDER ================= */

let reminderInterval=null;

function startHourlyReminder(){

  if(reminderInterval) return;

  reminderInterval=setInterval(async ()=>{

    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("status","pending");

    if(!data || data.length===0) return;

    alert("You have pending tasks. Please update status.");

  },60*60*1000);
}

/* ================= MASTER LOAD ================= */

async function loadAll(){

  await loadJD();
  await loadDaily();
  await renderStage("submission","submissionBody");
  await renderStage("proposal","proposalBody");
  await renderStage("interview","interviewBody");
  await renderStage("placement","placementBody");
  await renderStage("start","startBody");
  await renderKPI();
  await loadTasks();
  await loadMeetings();
}

window.onload = async function(){
  await checkAuth();
  await loadAll();
  startHourlyReminder();
};