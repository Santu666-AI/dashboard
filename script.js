/* =========================================================
   NETVISION ATS – FINAL PRODUCTION MASTER BUILD
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

  document.querySelectorAll(".sidebar a").forEach(a=>a.classList.remove("active-link"));
  event.target.classList.add("active-link");
}

/* ================= JD ================= */

async function addJD(){

  if(!jdNvr.value || !jdTitle.value){
    alert("NVR & Title required");
    return;
  }

  const { error } = await supabase.from("jd").insert([{
    date: jdDate.value || today(),
    nvr: jdNvr.value.trim(),
    title: jdTitle.value.trim(),
    client: jdClient.value.trim(),
    status: jdStatus.value
  }]);

  if(error){ alert(error.message); return; }

  jdNvr.value=""; jdTitle.value=""; jdClient.value="";
  loadAll();
}

async function updateJDStatus(id,val){
  await supabase.from("jd").update({status:val}).eq("id",id);
  loadAll();
}

async function deleteRecord(table,id){
  await supabase.from(table).delete().eq("id",id);
  loadAll();
}

async function loadJD(){
  const { data } = await supabase.from("jd").select("*").order("date",{ascending:false});
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
      <td><button onclick="deleteRecord('jd','${r.id}')">Delete</button></td>
    </tr>`;
  });

  loadActiveRequirements();
}

async function loadActiveRequirements(){
  const { data } = await supabase.from("jd").select("*").eq("status","Active");
  dailyRequirement.innerHTML='<option value="">Select Requirement</option>';
  data?.forEach(j=>{
    dailyRequirement.innerHTML+=
      `<option value="${j.nvr}">${j.nvr} - ${j.title}</option>`;
  });
}

async function autoFillClient(){
  const req = dailyRequirement.value;
  if(!req){ dailyClient.value=""; return; }
  const { data } = await supabase.from("jd").select("*").eq("nvr",req).single();
  dailyClient.value = data?.client || "";
}

/* ================= RESUME PARSER (Improved) ================= */

function parseResume(){

  const txt = resumeText.value.trim();
  if(!txt){ alert("Paste resume first"); return; }

  const email = txt.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phone = txt.match(/\+?\d[\d\-\s]{8,}/);

  const lines = txt.split("\n")
                   .map(x=>x.trim())
                   .filter(x=>x.length>2);

  dailyName.value = lines[0] || "";
  dailyEmail.value = email?.[0] || "";
  dailyPhone.value = phone?.[0] || "";
  dailyLocation.value = lines.find(l=>l.includes(",")) || "";
}

/* ================= DAILY ================= */

async function saveDaily(){

  if(!dailyName.value || !dailyRequirement.value){
    alert("Name & Requirement required");
    return;
  }

  const { error } = await supabase.from("daily").insert([{
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

  if(error){ alert(error.message); return; }

  clearDaily();
  loadAll();
}

function clearDaily(){
  dailyName.value="";
  dailyEmail.value="";
  dailyPhone.value="";
  dailyRequirement.value="";
  dailyClient.value="";
  dailyLocation.value="";
  dailyNotes.value="";
  resumeText.value="";
}

async function loadDaily(){
  const { data } = await supabase.from("daily").select("*").order("entry_date",{ascending:false});
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
        <button onclick="copyStage('daily','submission','${r.id}','submission_date')">Sub</button>
        <button onclick="copyStage('daily','proposal','${r.id}','proposal_date')">Proposal</button>
        <button onclick="deleteRecord('daily','${r.id}')">Del</button>
      </td>
    </tr>`;
  });
}

async function updateNote(table,id,val){
  await supabase.from(table).update({notes:val}).eq("id",id);
}

/* ================= GENERIC COPY ================= */

async function copyStage(from,to,id,dateField){

  const { data } = await supabase.from(from).select("*").eq("id",id).single();

  const payload={...data};
  delete payload.id;
  payload[dateField]=today();

  await supabase.from(to).insert([payload]);

  loadAll();
}

/* ================= STAGE RENDER ================= */

async function renderStage(stage, bodyId){

  const body=document.getElementById(bodyId);
  if(!body) return;

  const dateMap={
    submission:"submission_date",
    proposal:"proposal_date",
    interview:"interview_scheduled_on",
    placement:"placement_date",
    start:"start_date"
  };

  const { data }=await supabase.from(stage).select("*").order(dateMap[stage],{ascending:false});
  body.innerHTML="";

  data?.forEach((r,i)=>{

    let nextBtn="";
    if(stage==="submission")
      nextBtn=`<button onclick="copyStage('submission','interview','${r.id}','interview_scheduled_on')">Interview</button>`;
    if(stage==="interview")
      nextBtn=`<button onclick="copyStage('interview','placement','${r.id}','placement_date')">Placement</button>`;
    if(stage==="placement")
      nextBtn=`<button onclick="copyStage('placement','start','${r.id}','start_date')">Start</button>`;

    body.innerHTML+=`
    <tr>
      <td>${i+1}</td>
      <td>
        <input type="date"
          value="${r[dateMap[stage]]||""}"
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
        ${nextBtn}
        <button onclick="deleteRecord('${stage}','${r.id}')">Del</button>
      </td>
    </tr>`;
  });
}

async function updateStageDate(stage,id,val){

  const map={
    submission:"submission_date",
    proposal:"proposal_date",
    interview:"interview_scheduled_on",
    placement:"placement_date",
    start:"start_date"
  };

  await supabase.from(stage)
    .update({[map[stage]]:val})
    .eq("id",id);
}

/* ================= KPI ================= */

async function renderKPI(){

  const { data:sub }=await supabase.from("submission").select("*");
  const { data:int }=await supabase.from("interview").select("*");
  const { data:place }=await supabase.from("placement").select("*");
  const { data:start }=await supabase.from("start").select("*");

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
  if(!taskTitle.value||!taskDue.value) return;
  await supabase.from("tasks").insert([{title:taskTitle.value,due:taskDue.value,status:"pending"}]);
  taskTitle.value=""; taskDue.value="";
  loadAll();
}

async function loadTasks(){
  const { data }=await supabase.from("tasks").select("*").order("due",{ascending:true});
  taskList.innerHTML="";
  data?.forEach(t=>{
    taskList.innerHTML+=`
    <div class="mb-2">
      <strong>${t.title}</strong> (${t.due})
      <button onclick="deleteRecord('tasks','${t.id}')">Delete</button>
    </div>`;
  });
}

/* ================= MEETINGS ================= */

async function addMeeting(){
  if(!meetingDate.value||!meetingTitle.value) return;
  await supabase.from("meetings").insert([{
    date:meetingDate.value,
    title:meetingTitle.value,
    notes:meetingNotes.value
  }]);
  meetingDate.value=""; meetingTitle.value=""; meetingNotes.value="";
  loadAll();
}

async function loadMeetings(){
  const { data }=await supabase.from("meetings").select("*").order("date",{ascending:false});
  meetingList.innerHTML="";
  data?.forEach(m=>{
    meetingList.innerHTML+=`
    <div class="mb-2">
      <strong>${m.title}</strong> (${m.date})
      <p>${m.notes||""}</p>
      <button onclick="deleteRecord('meetings','${m.id}')">Delete</button>
    </div>`;
  });
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

window.onload=async function(){
  await checkAuth();
  await loadAll();
};