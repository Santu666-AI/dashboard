/* =========================================================
   NETVISION ATS – ENTERPRISE MASTER SCRIPT
========================================================= */

const SUPABASE_URL = "https://ftxrrgdmkpnghxilnpsk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0eHJyZ2Rta3BuZ2h4aWxucHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MDY0MzYsImV4cCI6MjA4NzE4MjQzNn0.KcqIN2ynBQWmglQ_-6eaFi3TGPSclB0TgeJ83XU_OWI";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun",
                "Jul","Aug","Sep","Oct","Nov","Dec"];

/* ================= UTIL ================= */

function today(){
  return new Date().toISOString().split("T")[0];
}

function switchTab(id){
  document.querySelectorAll(".section").forEach(s=>s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

async function logout(){
  await supabase.auth.signOut();
  window.location="index.html";
}

async function deleteRecord(table,id){
  await supabase.from(table).delete().eq("id",id);
  loadAll();
}

/* ================= DAILY ================= */

async function addDaily(){
  await supabase.from("daily").insert([{
    entry_date: today(),
    name: dailyName.value,
    email: dailyEmail.value,
    phone: dailyPhone.value,
    visa: dailyVisa.value,
    requirement: dailyRequirement.value,
    client: dailyClient.value,
    source: dailySource.value,
    location: dailyLocation.value,
    notes: dailyNotes.value
  }]);

  loadAll();
}

async function loadDaily(){
  const { data } = await supabase.from("daily").select("*");
  dailyBody.innerHTML="";

  data?.forEach(r=>{
    dailyBody.innerHTML+=`
      <tr>
        <td>${r.name}</td>
        <td>${r.email||""}</td>
        <td>${r.phone||""}</td>
        <td>${r.requirement||""}</td>
        <td>${r.client||""}</td>
        <td>${r.visa||""}</td>
        <td>
          <button onclick="copyToSubmission('${r.id}')">Sub</button>
          <button onclick="copyToProposal('${r.id}')">Proposal</button>
          <button onclick="deleteRecord('daily','${r.id}')">Del</button>
        </td>
      </tr>`;
  });
}

/* ================= SUBMISSION ================= */

async function copyToSubmission(id){
  const { data } = await supabase.from("daily").select("*").eq("id",id).single();

  await supabase.from("submission").insert([{
    submission_date: today(),
    name: data.name,
    email: data.email,
    phone: data.phone,
    visa: data.visa,
    requirement: data.requirement,
    client: data.client
  }]);

  loadAll();
}

async function loadSubmission(){
  const { data } = await supabase.from("submission").select("*");
  submissionBody.innerHTML="";

  data?.forEach(r=>{
    submissionBody.innerHTML+=`
      <tr>
        <td>${r.name}</td>
        <td>${r.client||""}</td>
        <td>
          <button onclick="copyToInterview('${r.id}')">Interview</button>
          <button onclick="deleteRecord('submission','${r.id}')">Del</button>
        </td>
      </tr>`;
  });
}

/* ================= PROPOSAL ================= */

async function copyToProposal(id){
  const { data } = await supabase.from("daily").select("*").eq("id",id).single();

  await supabase.from("proposal").insert([{
    proposal_date: today(),
    name: data.name,
    email: data.email,
    phone: data.phone,
    client: data.client,
    requirement: data.requirement
  }]);

  loadAll();
}

async function loadProposal(){
  const { data } = await supabase.from("proposal").select("*");
  proposalBody.innerHTML="";

  data?.forEach(r=>{
    proposalBody.innerHTML+=`
      <tr>
        <td>${r.name}</td>
        <td>${r.client||""}</td>
        <td>
          <button onclick="deleteRecord('proposal','${r.id}')">Del</button>
        </td>
      </tr>`;
  });
}

/* ================= INTERVIEW ================= */

async function copyToInterview(id){
  const { data } = await supabase.from("submission").select("*").eq("id",id).single();

  await supabase.from("interview").insert([{
    interview_scheduled_on: today(),
    name: data.name,
    client: data.client,
    visa: data.visa
  }]);

  loadAll();
}

async function loadInterview(){
  const { data } = await supabase.from("interview").select("*");
  interviewBody.innerHTML="";

  data?.forEach(r=>{
    interviewBody.innerHTML+=`
      <tr>
        <td>${r.name}</td>
        <td>${r.client||""}</td>
        <td>
          <button onclick="copyToPlacement('${r.id}')">Placement</button>
          <button onclick="deleteRecord('interview','${r.id}')">Del</button>
        </td>
      </tr>`;
  });
}

/* ================= PLACEMENT ================= */

async function copyToPlacement(id){
  const { data } = await supabase.from("interview").select("*").eq("id",id).single();

  await supabase.from("placement").insert([{
    placement_date: today(),
    name: data.name,
    client: data.client,
    visa: data.visa
  }]);

  loadAll();
}

async function loadPlacement(){
  const { data } = await supabase.from("placement").select("*");
  placementBody.innerHTML="";

  data?.forEach(r=>{
    placementBody.innerHTML+=`
      <tr>
        <td>${r.name}</td>
        <td>${r.client||""}</td>
        <td>
          <button onclick="copyToStart('${r.id}')">Start</button>
          <button onclick="deleteRecord('placement','${r.id}')">Del</button>
        </td>
      </tr>`;
  });
}

/* ================= START ================= */

async function copyToStart(id){
  const { data } = await supabase.from("placement").select("*").eq("id",id).single();

  await supabase.from("start").insert([{
    start_date: today(),
    name: data.name,
    client: data.client
  }]);

  loadAll();
}

async function loadStart(){
  const { data } = await supabase.from("start").select("*");
  startBody.innerHTML="";

  data?.forEach(r=>{
    startBody.innerHTML+=`
      <tr>
        <td>${r.name}</td>
        <td>${r.client||""}</td>
        <td>
          <button onclick="deleteRecord('start','${r.id}')">Del</button>
        </td>
      </tr>`;
  });
}

/* ================= TASK MANAGER ================= */

async function addTask(){
  await supabase.from("tasks").insert([{
    title: taskTitle.value,
    remarks: taskRemarks.value,
    due_date: taskDue.value,
    status: "pending"
  }]);
  loadAll();
}

async function completeTask(id){
  await supabase.from("tasks").update({status:"completed"}).eq("id",id);
  loadAll();
}

async function loadTasks(){
  const { data } = await supabase.from("tasks").select("*");
  taskBody.innerHTML="";
  data?.forEach(t=>{
    taskBody.innerHTML+=`
      <tr>
        <td>${t.title}</td>
        <td>${t.due_date||""}</td>
        <td>${t.status}</td>
        <td>
          ${t.status==="pending" ? `<button onclick="completeTask('${t.id}')">Complete</button>` : ""}
          <button onclick="deleteRecord('tasks','${t.id}')">Del</button>
        </td>
      </tr>`;
  });
}

/* Hourly Reminder */
setInterval(async()=>{
  const { data } = await supabase.from("tasks").select("*").eq("status","pending");
  if(data && data.length>0){
    alert("You have pending tasks. Please complete them.");
  }
},3600000);

/* ================= MEETINGS ================= */

async function addMeeting(){
  await supabase.from("meetings").insert([{
    meeting_date: meetingDate.value,
    title: meetingTitle.value,
    notes: meetingNotes.value
  }]);
  loadAll();
}

async function loadMeetings(){
  const { data } = await supabase.from("meetings").select("*");
  meetingBody.innerHTML="";
  data?.forEach(m=>{
    meetingBody.innerHTML+=`
      <tr>
        <td>${m.meeting_date||""}</td>
        <td>${m.title||""}</td>
        <td>${m.notes||""}</td>
        <td>
          <button onclick="deleteRecord('meetings','${m.id}')">Del</button>
        </td>
      </tr>`;
  });
}

/* ================= KPI ================= */

async function renderKPI(){
  const { data:sub } = await supabase.from("submission").select("*");
  const { data:int } = await supabase.from("interview").select("*");
  const { data:place } = await supabase.from("placement").select("*");
  const { data:start } = await supabase.from("start").select("*");

  kpiSub.innerText=sub?.length||0;
  kpiInt.innerText=int?.length||0;
  kpiPlace.innerText=place?.length||0;
  kpiStart.innerText=start?.length||0;

  monthlyBody.innerHTML="";

  for(let m=0;m<12;m++){
    const subC=sub?.filter(r=>r.submission_date && new Date(r.submission_date).getMonth()===m).length||0;
    const intC=int?.filter(r=>r.interview_scheduled_on && new Date(r.interview_scheduled_on).getMonth()===m).length||0;
    const placeC=place?.filter(r=>r.placement_date && new Date(r.placement_date).getMonth()===m).length||0;
    const startC=start?.filter(r=>r.start_date && new Date(r.start_date).getMonth()===m).length||0;

    monthlyBody.innerHTML+=`
      <tr>
        <td>${MONTHS[m]}</td>
        <td>${subC}</td>
        <td>${intC}</td>
        <td>${placeC}</td>
        <td>${startC}</td>
      </tr>`;
  }
}

/* ================= MASTER LOAD ================= */

async function loadAll(){
  await loadDaily();
  await loadSubmission();
  await loadProposal();
  await loadInterview();
  await loadPlacement();
  await loadStart();
  await loadTasks();
  await loadMeetings();
  await renderKPI();
}

window.onload = async function(){
  loadAll();
};