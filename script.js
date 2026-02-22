/* =========================================================
   NETVISION ATS – FINAL MASTER PRODUCTION SCRIPT
========================================================= */

const SUPABASE_URL = "https://ftxrrgdmkpnghxilnpsk.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_ANON_KEY_HERE";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun",
                "Jul","Aug","Sep","Oct","Nov","Dec"];

/* ================= AUTH ================= */

async function checkAuth(){
  const { data:{user} } = await supabase.auth.getUser();
  if(!user) window.location="index.html";
}

async function logout(){
  await supabase.auth.signOut();
  window.location="index.html";
}

/* ================= UTIL ================= */

function today(){
  return new Date().toISOString().split("T")[0];
}

function switchTab(id){
  document.querySelectorAll(".section").forEach(s=>s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

async function deleteRecord(table,id){
  await supabase.from(table).delete().eq("id",id);
  loadAll();
}

/* ================= JD ================= */

async function addJD(){
  await supabase.from("jd").insert([{
    date: jdDate.value || today(),
    nvr: jdNvr.value,
    title: jdTitle.value,
    client: jdClient.value,
    status: jdStatus.value
  }]);
  loadAll();
}

async function loadJD(){
  const { data } = await supabase.from("jd").select("*");
  jdBody.innerHTML="";
  dailyRequirement.innerHTML='<option value="">Select Requirement</option>';

  data?.forEach((r,i)=>{
    jdBody.innerHTML+=`
    <tr>
      <td>${i+1}</td>
      <td>${r.date||""}</td>
      <td>${r.nvr||""}</td>
      <td>${r.title||""}</td>
      <td>${r.client||""}</td>
      <td>${r.status||""}</td>
      <td><button onclick="deleteRecord('jd','${r.id}')">Delete</button></td>
    </tr>`;

    if(r.status==="Active"){
      dailyRequirement.innerHTML+=`<option value="${r.nvr}">${r.nvr}</option>`;
    }
  });
}

/* ================= DAILY ================= */

function parseResume(){
  const txt = resumeText.value.trim();
  if(!txt) return;

  const email = txt.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phone = txt.match(/\+?\d[\d\-\s]{8,}/);

  const lines = txt.split("\n").map(x=>x.trim()).filter(Boolean);

  dailyName.value = lines[0] || "";
  dailyEmail.value = email?.[0] || "";
  dailyPhone.value = phone?.[0] || "";
}

async function saveDaily(){
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
  loadAll();
}

async function loadDaily(){
  const { data } = await supabase.from("daily").select("*");
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
      <td>${r.notes||""}</td>
      <td>
        <button onclick="copyToSubmission('${r.id}')">Sub</button>
        <button onclick="copyToProposal('${r.id}')">Proposal</button>
        <button onclick="deleteRecord('daily','${r.id}')">Del</button>
      </td>
    </tr>`;
  });
}

/* ================= COPY STAGES ================= */

async function copyToSubmission(id){
  const { data } = await supabase.from("daily").select("*").eq("id",id).single();
  await supabase.from("submission").insert([{
    submission_date: today(),
    name: data.name,
    email: data.email,
    phone: data.phone,
    requirement: data.requirement,
    client: data.client,
    source: data.source,
    location: data.location,
    visa: data.visa
  }]);
  loadAll();
}

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

async function copyToInterview(id){
  const { data } = await supabase.from("submission").select("*").eq("id",id).single();
  await supabase.from("interview").insert([{
    interview_date: today(),
    name: data.name,
    email: data.email,
    phone: data.phone,
    visa: data.visa,
    client: data.client,
    requirement: data.requirement
  }]);
  loadAll();
}

async function copyToPlacement(id){
  const { data } = await supabase.from("interview").select("*").eq("id",id).single();
  await supabase.from("placement").insert([{
    placement_date: today(),
    name: data.name,
    email: data.email,
    phone: data.phone,
    visa: data.visa,
    client: data.client,
    requirement: data.requirement
  }]);
  loadAll();
}

async function copyToStart(id){
  const { data } = await supabase.from("placement").select("*").eq("id",id).single();
  await supabase.from("start").insert([{
    start_date: today(),
    name: data.name,
    client: data.client,
    requirement: data.requirement
  }]);
  loadAll();
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

/* ================= TASKS ================= */

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
      <td>${t.remarks||""}</td>
      <td>${t.due_date||""}</td>
      <td>${t.status}</td>
      <td>
        ${t.status==="pending" ? `<button onclick="completeTask('${t.id}')">Complete</button>` : ""}
        <button onclick="deleteRecord('tasks','${t.id}')">Delete</button>
      </td>
    </tr>`;
  });
}

function startReminder(){
  setInterval(async()=>{
    const { data } = await supabase.from("tasks").select("*").eq("status","pending");
    if(data && data.length>0){
      alert("You have pending tasks.");
    }
  },3600000);
}

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
      <td>${m.meeting_date}</td>
      <td>${m.title}</td>
      <td>${m.notes||""}</td>
      <td><button onclick="deleteRecord('meetings','${m.id}')">Delete</button></td>
    </tr>`;
  });
}

/* ================= MASTER LOAD ================= */

async function loadAll(){
  await loadJD();
  await loadDaily();
  await loadTasks();
  await loadMeetings();
  await renderKPI();
}

window.onload=async function(){
  await checkAuth();
  await loadAll();
  startReminder();
};