/* =========================================================
   NETVISION ATS – ENTERPRISE PRODUCTION SCRIPT
   PART 1 – CORE + JD + DAILY + SUBMISSION
========================================================= */

/* ================= SUPABASE SETUP ================= */

const SUPABASE_URL = "https://ftxrrgdmkpnghxilnpsk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0eHJyZ2Rta3BuZ2h4aWxucHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MDY0MzYsImV4cCI6MjA4NzE4MjQzNn0.KcqIN2ynBQWmglQ_-6eaFi3TGPSclB0TgeJ83XU_OWI";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* ================= UTILITIES ================= */

function el(id){ return document.getElementById(id); }

function today(){
  return new Date().toISOString().split("T")[0];
}

function switchTab(id){
  document.querySelectorAll(".section").forEach(s=>s.classList.remove("active"));
  el(id).classList.add("active");
}

async function logout(){
  await supabase.auth.signOut();
  window.location="index.html";
}

async function deleteRecord(table,id){
  await supabase.from(table).delete().eq("id",id);
  await loadAll();
}

/* =========================================================
   JD MODULE
========================================================= */

async function addJD(){
  await supabase.from("jd").insert([{
    date: el("jdDate").value,
    nvr: el("jdNvr").value,
    title: el("jdTitle").value,
    client: el("jdClient").value,
    status: el("jdStatus").value
  }]);
  await loadAll();
}

async function loadJD(){
  const { data } = await supabase.from("jd").select("*").order("date",{ascending:false});
  const body = el("jdBody");
  body.innerHTML="";

  data?.forEach(r=>{
    body.innerHTML += `
      <tr>
        <td>${r.date||""}</td>
        <td>${r.nvr||""}</td>
        <td>${r.title||""}</td>
        <td>${r.client||""}</td>
        <td>
          <select onchange="updateJDStatus('${r.id}',this.value)">
            <option ${r.status==="Active"?"selected":""}>Active</option>
            <option ${r.status==="Closed"?"selected":""}>Closed</option>
          </select>
        </td>
        <td>
          <button onclick="deleteRecord('jd','${r.id}')">Del</button>
        </td>
      </tr>
    `;
  });

  loadJDForDailyDropdown();
}

async function updateJDStatus(id,status){
  await supabase.from("jd").update({status}).eq("id",id);
  await loadAll();
}

async function loadJDForDailyDropdown(){
  const { data } = await supabase.from("jd")
    .select("*")
    .eq("status","Active");

  const dropdown = el("dailyRequirement");
  dropdown.innerHTML = `<option value="">Select Requirement</option>`;

  data?.forEach(j=>{
    dropdown.innerHTML += `<option value="${j.nvr}" data-client="${j.client}">
      ${j.nvr} - ${j.title}
    </option>`;
  });
}

el("dailyRequirement")?.addEventListener("change", function(){
  const selected = this.options[this.selectedIndex];
  const client = selected.getAttribute("data-client");
  el("dailyClient").value = client || "";
});

/* =========================================================
   DAILY MODULE
========================================================= */

async function addDaily(){
  await supabase.from("daily").insert([{
    entry_date: today(),
    name: el("dailyName").value,
    email: el("dailyEmail").value,
    phone: el("dailyPhone").value,
    visa: el("dailyVisa").value,
    requirement: el("dailyRequirement").value,
    client: el("dailyClient").value,
    source: el("dailySource").value,
    location: el("dailyLocation").value,
    notes: el("dailyNotes").value
  }]);
  clearDailyForm();
  await loadAll();
}

function clearDailyForm(){
  ["dailyName","dailyEmail","dailyPhone","dailyVisa",
   "dailyRequirement","dailyClient",
   "dailySource","dailyLocation","dailyNotes"]
   .forEach(id=>el(id).value="");
}

async function loadDaily(){
  const { data } = await supabase.from("daily").select("*").order("entry_date",{ascending:false});
  const body = el("dailyBody");
  body.innerHTML="";

  data?.forEach(r=>{
    body.innerHTML += `
      <tr>
        <td>${r.name}</td>
        <td>${r.requirement||""}</td>
        <td>${r.client||""}</td>
        <td>
          <button onclick="copyToSubmission('${r.id}')">Sub</button>
          <button onclick="copyToProposal('${r.id}')">Proposal</button>
          <button onclick="deleteRecord('daily','${r.id}')">Del</button>
        </td>
      </tr>
    `;
  });
}

/* =========================================================
   SUBMISSION MODULE
========================================================= */

async function copyToSubmission(id){
  const { data } = await supabase.from("daily")
    .select("*")
    .eq("id",id)
    .single();

  await supabase.from("submission").insert([{
    submission_date: today(),
    name: data.name,
    email: data.email,
    phone: data.phone,
    visa: data.visa,
    requirement: data.requirement,
    client: data.client,
    pay_rate: "",
    notes: ""
  }]);

  await loadAll();
}

async function updateSubmission(id){
  const row = document.querySelector(`#sub_${id}`);

  const submission_date = row.querySelector(".sub_date").value;
  const pay_rate = row.querySelector(".sub_pay").value;
  const notes = row.querySelector(".sub_notes").value;

  await supabase.from("submission").update({
    submission_date,
    pay_rate,
    notes
  }).eq("id",id);

  await loadAll();
}

async function loadSubmission(){
  const { data } = await supabase.from("submission")
    .select("*")
    .order("submission_date",{ascending:false});

  const body = el("submissionBody");
  body.innerHTML="";

  data?.forEach(r=>{
    body.innerHTML += `
      <tr id="sub_${r.id}">
        <td>
          <input type="date" class="sub_date" value="${r.submission_date||""}">
        </td>
        <td>${r.name}</td>
        <td>${r.client||""}</td>
        <td>
          <input class="sub_pay" value="${r.pay_rate||""}">
        </td>
        <td>
          <input class="sub_notes" value="${r.notes||""}">
        </td>
        <td>
          <button onclick="updateSubmission('${r.id}')">Save</button>
          <button onclick="copyToInterview('${r.id}')">Interview</button>
          <button onclick="deleteRecord('submission','${r.id}')">Del</button>
        </td>
      </tr>
    `;
  });
}

/* =========================================================
   MASTER LOAD
========================================================= */

async function loadAll(){
  await loadJD();
  await loadDaily();
  await loadSubmission();
  await renderKPI();  // KPI engine defined in Part 2
}

window.onload = async function(){
  await loadAll();
};
/* =========================================================
   PART 2 – PROPOSAL + INTERVIEW + PLACEMENT + START
   + TASKS + MEETINGS + KPI ENGINE
========================================================= */

/* =========================================================
   PROPOSAL MODULE
========================================================= */

async function copyToProposal(id){
  const { data } = await supabase.from("daily")
    .select("*")
    .eq("id",id)
    .single();

  await supabase.from("proposal").insert([{
    proposal_date: today(),
    name: data.name,
    email: data.email,
    phone: data.phone,
    client: data.client,
    program_name: "",
    proposal_writer: "",
    notes: ""
  }]);

  await loadAll();
}

async function updateProposal(id){
  const row = document.querySelector(`#proposal_${id}`);

  const proposal_date = row.querySelector(".proposal_date").value;
  const program_name = row.querySelector(".proposal_program").value;
  const proposal_writer = row.querySelector(".proposal_writer").value;

  await supabase.from("proposal").update({
    proposal_date,
    program_name,
    proposal_writer
  }).eq("id",id);

  await loadAll();
}

async function loadProposal(){
  const { data } = await supabase.from("proposal")
    .select("*")
    .order("proposal_date",{ascending:false});

  const body = el("proposalBody");
  body.innerHTML="";

  data?.forEach(r=>{
    body.innerHTML += `
      <tr id="proposal_${r.id}">
        <td><input type="date" class="proposal_date" value="${r.proposal_date||""}"></td>
        <td>${r.name}</td>
        <td><input class="proposal_program" value="${r.program_name||""}"></td>
        <td><input class="proposal_writer" value="${r.proposal_writer||""}"></td>
        <td>
          <button onclick="updateProposal('${r.id}')">Save</button>
          <button onclick="deleteRecord('proposal','${r.id}')">Del</button>
        </td>
      </tr>
    `;
  });
}

/* =========================================================
   INTERVIEW MODULE
========================================================= */

async function copyToInterview(id){
  const { data } = await supabase.from("submission")
    .select("*")
    .eq("id",id)
    .single();

  await supabase.from("interview").insert([{
    interview_scheduled_on: today(),
    name: data.name,
    email: data.email,
    phone: data.phone,
    visa: data.visa,
    round: "1st",
    result: "",
    notes: ""
  }]);

  await loadAll();
}

async function updateInterview(id){
  const row = document.querySelector(`#interview_${id}`);

  const interview_scheduled_on = row.querySelector(".int_date").value;
  const round = row.querySelector(".int_round").value;
  const result = row.querySelector(".int_result").value;

  await supabase.from("interview").update({
    interview_scheduled_on,
    round,
    result
  }).eq("id",id);

  await loadAll();
}

async function loadInterview(){
  const { data } = await supabase.from("interview")
    .select("*")
    .order("interview_scheduled_on",{ascending:false});

  const body = el("interviewBody");
  body.innerHTML="";

  data?.forEach(r=>{
    body.innerHTML += `
      <tr id="interview_${r.id}">
        <td><input type="date" class="int_date" value="${r.interview_scheduled_on||""}"></td>
        <td>${r.name}</td>
        <td>
          <select class="int_round">
            <option ${r.round==="1st"?"selected":""}>1st</option>
            <option ${r.round==="2nd"?"selected":""}>2nd</option>
          </select>
        </td>
        <td>
          <select class="int_result">
            <option value="">--</option>
            <option ${r.result==="Selected"?"selected":""}>Selected</option>
            <option ${r.result==="Rejected"?"selected":""}>Rejected</option>
          </select>
        </td>
        <td>
          <button onclick="updateInterview('${r.id}')">Save</button>
          <button onclick="copyToPlacement('${r.id}')">Placement</button>
          <button onclick="deleteRecord('interview','${r.id}')">Del</button>
        </td>
      </tr>
    `;
  });
}

/* =========================================================
   PLACEMENT MODULE
========================================================= */

async function copyToPlacement(id){
  const { data } = await supabase.from("interview")
    .select("*")
    .eq("id",id)
    .single();

  await supabase.from("placement").insert([{
    placement_date: today(),
    name: data.name,
    email: data.email,
    phone: data.phone,
    visa: data.visa,
    offer_status: "",
    notes: ""
  }]);

  await loadAll();
}

async function updatePlacement(id){
  const row = document.querySelector(`#placement_${id}`);

  const offer_status = row.querySelector(".place_status").value;

  await supabase.from("placement").update({
    offer_status
  }).eq("id",id);

  await loadAll();
}

async function loadPlacement(){
  const { data } = await supabase.from("placement")
    .select("*")
    .order("placement_date",{ascending:false});

  const body = el("placementBody");
  body.innerHTML="";

  data?.forEach(r=>{
    body.innerHTML += `
      <tr id="placement_${r.id}">
        <td>${r.placement_date||""}</td>
        <td>${r.name}</td>
        <td>
          <select class="place_status">
            <option value="">--</option>
            <option ${r.offer_status==="Accepted"?"selected":""}>Accepted</option>
            <option ${r.offer_status==="Rejected"?"selected":""}>Rejected</option>
          </select>
        </td>
        <td>
          <button onclick="updatePlacement('${r.id}')">Save</button>
          <button onclick="copyToStart('${r.id}')">Start</button>
          <button onclick="deleteRecord('placement','${r.id}')">Del</button>
        </td>
      </tr>
    `;
  });
}

/* =========================================================
   START MODULE
========================================================= */

async function copyToStart(id){
  const { data } = await supabase.from("placement")
    .select("*")
    .eq("id",id)
    .single();

  await supabase.from("start").insert([{
    start_date: today(),
    name: data.name,
    client: data.client
  }]);

  await loadAll();
}

async function updateStart(id){
  const row = document.querySelector(`#start_${id}`);
  const start_date = row.querySelector(".start_date").value;

  await supabase.from("start").update({ start_date }).eq("id",id);
  await loadAll();
}

async function loadStart(){
  const { data } = await supabase.from("start")
    .select("*")
    .order("start_date",{ascending:false});

  const body = el("startBody");
  body.innerHTML="";

  data?.forEach(r=>{
    body.innerHTML += `
      <tr id="start_${r.id}">
        <td><input type="date" class="start_date" value="${r.start_date||""}"></td>
        <td>${r.name}</td>
        <td>${r.client||""}</td>
        <td>
          <button onclick="updateStart('${r.id}')">Save</button>
          <button onclick="deleteRecord('start','${r.id}')">Del</button>
        </td>
      </tr>
    `;
  });
}

/* =========================================================
   TASKS MODULE
========================================================= */

async function addTask(){
  await supabase.from("tasks").insert([{
    title: el("taskTitle").value,
    remarks: el("taskRemarks").value,
    due_date: el("taskDue").value,
    status: "Pending"
  }]);
  await loadAll();
}

async function completeTask(id){
  await supabase.from("tasks")
    .update({status:"Completed"})
    .eq("id",id);
  await loadAll();
}

async function loadTasks(){
  const { data } = await supabase.from("tasks")
    .select("*")
    .order("due_date",{ascending:true});

  const body = el("taskBody");
  body.innerHTML="";

  data?.forEach(t=>{
    body.innerHTML += `
      <tr>
        <td>${t.title}</td>
        <td>${t.due_date||""}</td>
        <td>${t.status}</td>
        <td>
          ${t.status==="Pending" ? `<button onclick="completeTask('${t.id}')">Complete</button>` : ""}
          <button onclick="deleteRecord('tasks','${t.id}')">Del</button>
        </td>
      </tr>
    `;
  });
}

/* Hourly Reminder */
setInterval(async ()=>{
  const { data } = await supabase.from("tasks")
    .select("*")
    .eq("status","Pending");

  if(data && data.length>0){
    alert("Reminder: You have pending tasks.");
  }
}, 3600000);

/* =========================================================
   MEETINGS MODULE
========================================================= */

async function addMeeting(){
  await supabase.from("meetings").insert([{
    meeting_date: el("meetingDate").value,
    title: el("meetingTitle").value,
    notes: el("meetingNotes").value
  }]);
  await loadAll();
}

async function loadMeetings(){
  const { data } = await supabase.from("meetings")
    .select("*")
    .order("meeting_date",{ascending:false});

  const body = el("meetingBody");
  body.innerHTML="";

  data?.forEach(m=>{
    body.innerHTML += `
      <tr>
        <td>${m.meeting_date||""}</td>
        <td>${m.title}</td>
        <td>${m.notes||""}</td>
        <td>
          <button onclick="deleteRecord('meetings','${m.id}')">Del</button>
        </td>
      </tr>
    `;
  });
}

/* =========================================================
   KPI ENGINE
========================================================= */

async function renderKPI(){
  const { data:sub } = await supabase.from("submission").select("*");
  const { data:int } = await supabase.from("interview").select("*");
  const { data:place } = await supabase.from("placement").select("*");
  const { data:start } = await supabase.from("start").select("*");

  el("kpiSub").innerText=sub?.length||0;
  el("kpiInt").innerText=int?.length||0;
  el("kpiPlace").innerText=place?.length||0;
  el("kpiStart").innerText=start?.length||0;

  const monthly = el("monthlyBody");
  monthly.innerHTML="";

  for(let m=0;m<12;m++){
    const subC=sub?.filter(r=>r.submission_date && new Date(r.submission_date).getMonth()===m).length||0;
    const intC=int?.filter(r=>r.interview_scheduled_on && new Date(r.interview_scheduled_on).getMonth()===m).length||0;
    const placeC=place?.filter(r=>r.placement_date && new Date(r.placement_date).getMonth()===m).length||0;
    const startC=start?.filter(r=>r.start_date && new Date(r.start_date).getMonth()===m).length||0;

    monthly.innerHTML += `
      <tr>
        <td>${MONTHS[m]}</td>
        <td>${subC}</td>
        <td>${intC}</td>
        <td>${placeC}</td>
        <td>${startC}</td>
      </tr>
    `;
  }
}

/* =========================================================
   MASTER LOAD (FINAL CLEAN VERSION)
========================================================= */

async function masterLoad(){

  try {

    await loadJD();
    await loadDaily();
    await loadSubmission();
    await loadProposal();
    await loadInterview();
    await loadPlacement();
    await loadStart();
    await loadTasks();
    await loadMeetings();
    await renderKPI();

  } catch(error){
    console.error("MASTER LOAD ERROR:", error);
  }
}

/* DOM READY SAFE INITIALIZER */

document.addEventListener("DOMContentLoaded", async function(){

  const req = el("dailyRequirement");
  if(req){
    req.addEventListener("change", function(){
      const selected = this.options[this.selectedIndex];
      const client = selected.getAttribute("data-client");
      el("dailyClient").value = client || "";
    });
  }

  await masterLoad();

});