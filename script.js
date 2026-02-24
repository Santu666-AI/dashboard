/* =========================================================
   NETVISION ATS – TRUE MASTER BUILD
========================================================= */

/* ================= SUPABASE INIT ================= */

/* ================= SUPABASE INIT ================= */

const SUPABASE_URL = "https://ftxrrgdmkpnghxilnpsk.supabase.co";

const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0eHJyZ2Rta3BuZ2h4aWxucHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MDY0MzYsImV4cCI6MjA4NzE4MjQzNn0.KcqIN2ynBQWmglQ_-6eaFi3TGPSclB0TgeJ83XU_OWI";

/* Use different variable name to avoid conflict */
const sb = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

/* ================= DOM HELPER ================= */
const $ = id => document.getElementById(id);

console.log("Supabase Connected Successfully");

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun",
                "Jul","Aug","Sep","Oct","Nov","Dec"];

/* ================= DATABASE ================= */

let DB = JSON.parse(localStorage.getItem("ATS_DB")) || {
  jd: [],
  daily: [],
  submission: [],
  proposal: [],
  interview: [],
  placement: [],
  start: [],
  tasks: [],
  meetings: [],
  junk: []
};

function saveDB(){
  localStorage.setItem("ATS_DB", JSON.stringify(DB));
}

function saveAndRender(){
  saveDB();
  loadDashboard();
}

function today(){
  const d = new Date();
  return d.getFullYear() + "-" +
         String(d.getMonth()+1).padStart(2,"0") + "-" +
         String(d.getDate()).padStart(2,"0");
}

function uid(){
  return Date.now() + Math.floor(Math.random()*1000);
}

/* ================= TAB SWITCH ================= */


/* ================= JD ================= */

function addJD(){
  DB.jd.unshift({
    date: jdDate.value || today(),
    nvr: jdNvr.value.trim(),
    title: jdTitle.value.trim(),
    client: jdClient.value.trim(),
    status: jdStatus.value
  });
  saveAndRender();
}

function updateJDStatus(i,val){
  DB.jd[i].status = val;
  saveAndRender();
}

function renderJD(){
  if(!jdBody) return;
  jdBody.innerHTML="";

  DB.jd.forEach((r,i)=>{
    jdBody.innerHTML+=`
      <tr>
        <td>${i+1}</td>
        <td>${r.date}</td>
        <td>${r.nvr}</td>
        <td>${r.title}</td>
        <td>${r.client}</td>
        <td>
          <select onchange="updateJDStatus(${i},this.value)">
            <option ${r.status==="Active"?"selected":""}>Active</option>
            <option ${r.status==="Hold"?"selected":""}>Hold</option>
            <option ${r.status==="Closed"?"selected":""}>Closed</option>
          </select>
        </td>
        <td><button onclick="deleteRow('jd',${i})">Delete</button></td>
      </tr>`;
  });

  loadActiveRequirements();
}

function loadActiveRequirements(){
  if(!dailyRequirement) return;
  dailyRequirement.innerHTML='<option value="">Select Requirement</option>';
  DB.jd.filter(j=>j.status==="Active").forEach(j=>{
    dailyRequirement.innerHTML+=
      `<option value="${j.nvr}">${j.nvr} - ${j.title}</option>`;
  });
}

function autoFillClient(){
  const req = dailyRequirement.value;
  const jd = DB.jd.find(j=>j.nvr===req);
  dailyClient.value = jd ? jd.client : "";
}

/* ================= RESUME ================= */

/* ================= RESUME PARSER ================= */

function parseResume(){

  // find textarea
  const textarea =
      document.getElementById("resumeText");

  if(!textarea){
    alert("Resume textbox not found");
    return;
  }

  const text = textarea.value;

  if(text.trim() === ""){
    alert("Paste resume first");
    return;
  }

  // find email
  const email =
      text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);

  // find phone
  const phone =
      text.match(/(\+?\d[\d\s\-]{8,})/);

  // fill email
  const emailInput =
      document.getElementById("resumeEmail");

  if(emailInput && email){
      emailInput.value = email[0];
  }

  // fill phone
  const phoneInput =
      document.getElementById("resumePhone");

  if(phoneInput && phone){
      phoneInput.value = phone[0];
  }

  alert("Resume Parsed Successfully ✅");
}

/* ================= DAILY ================= */

function saveDaily(){
  DB.daily.unshift({
    entry_date: today(),
    name: dailyName.value,
    email: dailyEmail.value,
    phone: dailyPhone.value,
    requirement: dailyRequirement.value,
    client: dailyClient.value,
    location: dailyLocation.value,
    visa: dailyVisa.value,
    source: dailySource.value,
    notes: dailyNotes.value
  });

  clearDaily();
  saveAndRender();
}

function clearDaily(){
  dailyName.value="";
  dailyEmail.value="";
  dailyPhone.value="";
  dailyRequirement.value="";
  dailyClient.value="";
  dailyLocation.value="";
  dailyVisa.value="US Citizen";
  dailySource.value="";
  dailyNotes.value="";
  resumeText.value="";
}

function renderDaily(){
  if(!dailyBody) return;

  dailyBody.innerHTML="";

  const todayDate = today();

  let grouped = {};

  /* Group by entry_date */
  DB.daily.forEach(r=>{
    if(!grouped[r.entry_date]){
      grouped[r.entry_date] = [];
    }
    grouped[r.entry_date].push(r);
  });

  Object.keys(grouped)
    .sort((a,b)=> new Date(b) - new Date(a))  // latest first
    .forEach(date=>{

      const isToday = date === todayDate;

      /* Date header row */
      dailyBody.innerHTML += `
        <tr class="date-row ${isToday ? 'today-row' : ''}">
          <td colspan="12">
            ${formatDisplayDate(date)}
          </td>
        </tr>
      `;

      grouped[date].forEach((r,index)=>{

        dailyBody.innerHTML += `
          <tr>
            <td>${index+1}</td>
            <td>${r.entry_date}</td>
            <td>${r.name||""}</td>
            <td>${r.email||""}</td>
            <td>${r.phone||""}</td>
            <td>${r.requirement||""}</td>
            <td>${r.client||""}</td>
            <td>${r.location||""}</td>
            <td>${r.visa||""}</td>
            <td>${r.source||""}</td>
            <td>
              <input value="${r.notes||""}"
                onchange="updateNote('daily',${DB.daily.indexOf(r)},this.value)">
            </td>
            <td>
              <button onclick="moveToSubmission(${DB.daily.indexOf(r)})">Sub</button>
              <button onclick="moveToProposal(${DB.daily.indexOf(r)})">Proposal</button>
              <button onclick="deleteRow('daily',${DB.daily.indexOf(r)})">Del</button>
            </td>
          </tr>
        `;
      });

    });
}

/* ================= STAGE MOVEMENT ================= */

function moveToSubmission(i){
  const base = {...DB.daily[i]};
  base.submission_date = today();
  DB.submission.unshift(base);
  saveAndRender();
}

function moveToProposal(i){
  const base = {...DB.daily[i]};
  base.proposal_date = today();
  DB.proposal.unshift(base);
  saveAndRender();
}

function moveToInterview(i){
  const base = {...DB.submission[i]};
  base.interview_scheduled_on = today();
  DB.interview.unshift(base);
  saveAndRender();
}

function moveToPlacement(i){
  const base = {...DB.interview[i]};
  base.placement_date = today();
  DB.placement.unshift(base);
  saveAndRender();
}

function moveToStart(i){
  const base = {...DB.placement[i]};
  base.start_date = today();
  DB.start.unshift(base);
  saveAndRender();
}

function deleteRow(tab,i){
  DB[tab].splice(i,1);
  saveAndRender();
}

function updateNote(tab,i,val){
  DB[tab][i].notes = val;
  saveDB();
}

/* ================= STAGE RENDER ================= */

function renderStage(stage, bodyId){
  const body = document.getElementById(bodyId);
  if(!body) return;

  body.innerHTML="";

  DB[stage].forEach((r,i)=>{

    let dateField="";
    let actionButtons="";

    if(stage==="submission"){
      dateField = `
        <input type="date"
          value="${r.submission_date || ""}"
          onchange="updateStageDate('submission',${i},this.value)">
      `;
      actionButtons = `<button onclick="moveToInterview(${i})">Interview</button>`;
    }

    if(stage==="proposal"){
      dateField = `
        <input type="date"
          value="${r.proposal_date || ""}"
          onchange="updateStageDate('proposal',${i},this.value)">
      `;
    }

    if(stage==="interview"){
      dateField = `
        <input type="date"
          value="${r.interview_scheduled_on || ""}"
          onchange="updateStageDate('interview',${i},this.value)">
      `;
      actionButtons = `<button onclick="moveToPlacement(${i})">Placement</button>`;
    }

    if(stage==="placement"){
      dateField = `
        <input type="date"
          value="${r.placement_date || ""}"
          onchange="updateStageDate('placement',${i},this.value)">
      `;
      actionButtons = `<button onclick="moveToStart(${i})">Start</button>`;
    }

    if(stage==="start"){
      dateField = `
        <input type="date"
          value="${r.start_date || ""}"
          onchange="updateStageDate('start',${i},this.value)">
      `;
    }

    body.innerHTML+=`
      <tr>
        <td>${i+1}</td>
        <td>${r.entry_date || r.submission_date || ""}</td>
        <td>${r.name || ""}</td>
        <td>${r.email || ""}</td>
        <td>${r.phone || ""}</td>
        <td>${r.requirement || ""}</td>
        <td>${r.client || ""}</td>
        <td>${r.location || ""}</td>
        <td>${r.visa || ""}</td>
        <td>${dateField}</td>
        <td>
          <input value="${r.notes||""}"
            onchange="updateNote('${stage}',${i},this.value)">
        </td>
        <td>
          ${actionButtons}
          <button onclick="deleteRow('${stage}',${i})">Del</button>
        </td>
      </tr>
    `;
  });
}

function updateStageDate(stage,i,val){
  if(stage==="submission") DB.submission[i].submission_date=val;
  if(stage==="interview") DB.interview[i].interview_scheduled_on=val;
  if(stage==="placement") DB.placement[i].placement_date=val;
  if(stage==="start") DB.start[i].start_date=val;
  saveAndRender();
}

/* ================= KPI ================= */

function renderKPI(){
  if(!kpiSub) return;

  kpiSub.innerText = DB.submission.length;
  kpiInt.innerText = DB.interview.length;
  kpiPlace.innerText = DB.placement.length;
  kpiStart.innerText = DB.start.length;

  if(!monthlyBody) return;
  monthlyBody.innerHTML="";

  for(let m=0;m<12;m++){
    const sub = countMonth(DB.submission,"submission_date",m);
    const int = countMonth(DB.interview,"interview_scheduled_on",m);
    const place = countMonth(DB.placement,"placement_date",m);
    const start = countMonth(DB.start,"start_date",m);

    monthlyBody.innerHTML+=`
      <tr>
        <td>${MONTHS[m]}</td>
        <td>${sub}</td>
        <td>${int}</td>
        <td>${place}</td>
        <td>${start}</td>
      </tr>`;
  }
}

function countMonth(arr,field,month){
  return arr.filter(r=>{
    if(!r[field]) return false;
    return new Date(r[field]).getMonth()===month;
  }).length;
}

/* ================= TASK SYSTEM ================= */

function addTask(){
  if(!taskTitle.value || !taskDue.value) return;

  DB.tasks.unshift({
    id: uid(),
    title: taskTitle.value,
    due: taskDue.value,
    status: "pending"
  });

  taskTitle.value="";
  taskDue.value="";
  saveAndRender();
}

function updateTask(id,status){
  const task = DB.tasks.find(t=>t.id===id);
  if(!task) return;

  if(status==="delete"){
    DB.junk.push(task);
    DB.tasks = DB.tasks.filter(t=>t.id!==id);
  }else{
    task.status=status;
  }

  saveAndRender();
}

function renderTasks(){
  if(!taskList) return;
  taskList.innerHTML="";
  const now = today();

  DB.tasks.forEach(t=>{
    let cls="";
    if(t.status==="pending" && t.due < now) cls="task-overdue";
    else if(t.status==="pending" && t.due===now) cls="task-today";
    else if(t.status==="done") cls="task-done";

    taskList.innerHTML+=`
      <div class="task ${cls}">
        <div>
          <strong>${t.title}</strong><br>
          <small>Due: ${t.due}</small>
        </div>
        <div>
          ${t.status==="pending"?`<button onclick="updateTask(${t.id},'done')">Submit ✔</button>`:""}
          <button onclick="updateTask(${t.id},'delete')">Delete</button>
        </div>
      </div>
    `;
  });
}

/* ================= MEETING SYSTEM ================= */

function addMeeting(){
  if(!meetingDate.value || !meetingTitle.value) return;

  DB.meetings.unshift({
    id: uid(),
    date: meetingDate.value,
    title: meetingTitle.value,
    notes: meetingNotes.value
  });

  meetingDate.value="";
  meetingTitle.value="";
  meetingNotes.value="";
  saveAndRender();
}

function renderMeetings(){
  if(!meetingList) return;

  meetingList.innerHTML="";
  DB.meetings.sort((a,b)=>new Date(b.date)-new Date(a.date));

  DB.meetings.forEach(m=>{
    meetingList.innerHTML+=`
      <div class="meeting">
        <strong>${m.title}</strong><br>
        <small>${m.date}</small>
        <p>${m.notes||""}</p>
      </div>
    `;
  });
}

/* ================= HOURLY REMINDER ================= */

let reminderInterval=null;

function startHourlyReminder(){
  if(reminderInterval) return;

  reminderInterval=setInterval(()=>{
    const pending=DB.tasks.filter(t=>t.status==="pending");
    if(pending.length===0) return;

    const audio=new Audio("https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg");
    audio.loop=true;
    audio.play();

    setTimeout(()=>{
      audio.pause();
      audio.currentTime=0;
    },30000);

    alert("You have pending tasks. Please submit if completed.");

  },60*60*1000);
}

/* ================= AUTH + DASHBOARD LOAD ================= */

function loadDashboard(){
  renderJD();
  renderDaily();
  renderStage("submission","submissionBody");
  renderStage("proposal","proposalBody");
  renderStage("interview","interviewBody");
  renderStage("placement","placementBody");
  renderStage("start","startBody");
  renderKPI();
  renderTasks();
  renderMeetings();
}

/* ================= LOGIN ================= */

async function login(){

  const emailInput =
      document.getElementById("loginEmail") ||
      document.getElementById("username");

  const passwordInput =
      document.getElementById("password");

  if(!emailInput || !passwordInput){
      alert("Login form not detected");
      return;
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if(!email || !password){
      alert("Enter email & password");
      return;
  }

  const { data, error } =
      await sb.auth.signInWithPassword({
          email,
          password
      });

  if(error){
      alert(error.message);
      return;
  }

  console.log("✅ Login Success");

  window.location.href = "dashboard.html";
}

/* ================= CHECK SESSION ================= */

async function checkUser(){

  const { data: { session } } = await sb.auth.getSession();

  if(session){
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("app").style.display = "block";
    loadDashboard();
  } else {
    document.getElementById("loginScreen").style.display = "flex";
    document.getElementById("app").style.display = "none";
  }
}

/* ================= PAGE LOAD ================= */

document.addEventListener("DOMContentLoaded", function(){

  checkUser();   // login/session check
  initTabs();    // ⭐ enable sidebar switching

});

/* ===============================
   TAB ROUTER FIX
================================*/

function initTabs(){

  const links = document.querySelectorAll(".sidebar a[data-tab]");
  const sections = document.querySelectorAll(".section");

  links.forEach(link => {

    link.addEventListener("click", function(){

      const tab = this.getAttribute("data-tab");

      // remove active section
      sections.forEach(sec =>
        sec.classList.remove("active")
      );

      // activate selected section
      const target = document.getElementById(tab);
      if(target){
        target.classList.add("active");
      }
    // sidebar highlight
      links.forEach(l =>
        l.classList.remove("active-link")
      );

      this.classList.add("active-link");

    });

  });

}

function switchSection(tab){

  document.querySelectorAll(".section")
    .forEach(sec => sec.classList.remove("active"));

  const target = document.getElementById(tab);
  if(target) target.classList.add("active");

  document.querySelectorAll(".sidebar a")
    .forEach(a => a.classList.remove("active-link"));

  const link =
    document.querySelector(`.sidebar a[data-tab="${tab}"]`);

  if(link) link.classList.add("active-link");
}
    
/* ================= RESUME → DAILY ================= */

function addResumeToDaily(){

  const record = {
    entry_date: today(),
    name: resumeName.value || "",
    email: resumeEmail.value || "",
    phone: resumePhone.value || "",
    requirement: "",
    client: "",
    location: resumeLocation.value || "",
    visa: resumeVisa.value || "",
    source: "",
    notes: "Parsed Resume"
  };

  DB.daily.unshift(record);

  saveAndRender();

  switchSection("daily");

  alert("✅ Candidate added to Daily Tracker");
}