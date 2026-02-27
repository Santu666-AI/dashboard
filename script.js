/* =========================================================
   NETVISION ATS – TRUE MASTER BUILD
========================================================= */


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

const ATS_VERSION = "NVR ATS v1.0 LOCKED";
console.log(ATS_VERSION);

/* ===== DATE FORMAT HELPER ===== */
function formatDisplayDate(dateStr){

  if(!dateStr) return "";

  const [year, month, day] = dateStr.split("-");

  const monthNames = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"
  ];

  return `${monthNames[parseInt(month)-1]} ${parseInt(day)}, ${year}`;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun",
                "Jul","Aug","Sep","Oct","Nov","Dec"];

/* ================= DATABASE ================= */

const DB = JSON.parse(localStorage.getItem("ATS_DB")) || {
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

/* ✅ SAFE PRODUCTION LOCK */
Object.seal(DB);

/* ================= CLOUD BACKUP ================= */

async function backupToCloud(){

  try{
    const { error } =
      await sb.from("ats_backup")
        .insert([{ data: DB }]);

    if(error){
      console.log("Backup Failed", error.message);
    }else{
      console.log("✅ Cloud Backup Success");
    }

  }catch(e){
    console.log("Backup Error", e);
  }
}


async function saveDB(){


  /* ✅ SAVE LOCALLY */
  localStorage.setItem(
    "ATS_DB",
    JSON.stringify(DB)
  );

  /* ✅ SAVE TO CLOUD */
  if(Date.now() % 2 === 0) backupToCloud();
}

function today(){

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  return formatter.format(new Date());
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

function parseResume(){

  const rawText = document.getElementById("resumeText").value;

  if(!rawText.trim()){
    alert("Paste resume first");
    return;
  }

  const text = rawText.replace(/\r/g,"");
  const lines = text.split("\n").map(l=>l.trim()).filter(Boolean);

  /* ================= EMAIL ================= */
  const emailMatch =
    text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);

  const email = emailMatch ? emailMatch[0] : "";
  document.getElementById("resumeEmail").value = email;


  /* ================= PHONE (STRICT US) ================= */
  const phoneMatch =
    text.match(/\b(\+1\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/);

  const phone = phoneMatch ? phoneMatch[0] : "";
  document.getElementById("resumePhone").value = phone;


  /* ================= NAME DETECTION (ENTERPRISE) ================= */

  const invalidWords = [
    "resume","profile","summary","engineer","developer",
    "consultant","architect","manager","analyst",
    "bachelor","master","university","college",
    "curriculum","vitae","email","phone","address",
    "experience","skills","objective"
  ];

  let detectedName = "";

  for(const line of lines){

    const wordCount = line.split(" ").length;

    if(
      wordCount >= 2 &&
      wordCount <= 4 &&
      /^[A-Za-z.\-\s]+$/.test(line) &&
      !invalidWords.some(w =>
        line.toLowerCase().includes(w)
      )
    ){
      detectedName = line;
      break;
    }
  }

  document.getElementById("resumeName").value = detectedName;


  /* ================= LOCATION DETECTION (ADVANCED US) ================= */

  const stateCodes = [
    "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
    "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
    "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
    "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
    "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
  ];

  const stateNames = [
    "Alabama","Alaska","Arizona","Arkansas","California",
    "Colorado","Connecticut","Delaware","Florida","Georgia",
    "Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas",
    "Kentucky","Louisiana","Maine","Maryland","Massachusetts",
    "Michigan","Minnesota","Mississippi","Missouri","Montana",
    "Nebraska","Nevada","New Hampshire","New Jersey",
    "New Mexico","New York","North Carolina","North Dakota",
    "Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island",
    "South Carolina","South Dakota","Tennessee","Texas","Utah",
    "Vermont","Virginia","Washington","West Virginia",
    "Wisconsin","Wyoming"
  ];

  let locationFound = "";

  for(const line of lines){

    // City, ST
    const stateCodeMatch =
      line.match(new RegExp(`([A-Za-z\\s]+),?\\s?(${stateCodes.join("|")})\\b`));

    if(stateCodeMatch){
      locationFound = stateCodeMatch[0];
      break;
    }

    // City, Full State Name
    const stateNameMatch =
      line.match(new RegExp(`([A-Za-z\\s]+),?\\s?(${stateNames.join("|")})\\b`,"i"));

    if(stateNameMatch){
      locationFound = stateNameMatch[0];
      break;
    }
  }

  document.getElementById("resumeLocation").value = locationFound;


  /* ================= VISA DETECTION ================= */

  let visaStatus = "";

  if(/US Citizen/i.test(text)) visaStatus = "US Citizen";
  else if(/Green Card|GC Holder/i.test(text)) visaStatus = "GC";
  else if(/H1B/i.test(text)) visaStatus = "H1B";
  else if(/OPT/i.test(text)) visaStatus = "OPT";

  if(document.getElementById("resumeVisa")){
    document.getElementById("resumeVisa").value = visaStatus;
  }


  /* ================= MOVE TO DAILY ================= */

  dailyName.value = detectedName;
  dailyEmail.value = email;
  dailyPhone.value = phone;
  dailyLocation.value = locationFound;
  if(dailyVisa) dailyVisa.value = visaStatus;

  alert("✅ Enterprise Resume Parsed Successfully");

  switchSection("daily");
}

/* ================= DAILY ================= */

/* =====================================
   DAILY SAVE FUNCTION - FINAL VERSION
===================================== */

function saveDaily(){

  /* ✅ REQUIRED FIELD VALIDATION */
  if(!dailyName.value || !dailyEmail.value){
    alert("Name & Email required");
    return;
  }

  /* ✅ CREATE DAILY RECORD */
  const record = {
    entry_date: today(),
    name: dailyName.value.trim(),
    email: dailyEmail.value.trim(),
    phone: dailyPhone.value.trim(),
    requirement: dailyRequirement.value,
    client: dailyClient.value,
    location: dailyLocation.value,
    visa: dailyVisa.value,
    source: dailySource.value,
    notes: dailyNotes.value
  };

  /* ✅ INSERT INTO DATABASE */
  DB.daily.unshift(record);

  /* ✅ CLEAR FORM */
  clearDaily();

  /* ✅ SAVE DATABASE */
  saveDB();

  /* ✅ REFRESH DAILY TABLE */
  renderDaily();

  /* ✅ ENSURE DAILY TAB VISIBLE */
  switchSection("daily");
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
  base.stage_created_at = Date.now();  // ⭐ important
  DB.submission.unshift(base);
  saveAndRender();
}
function moveToProposal(i){
  const base = {...DB.daily[i]};
  base.proposal_date = today();
  base.stage_created_at = Date.now();
  DB.proposal.unshift(base);
  saveAndRender();
}

function moveToInterview(i){
  const base = {...DB.submission[i]};
  base.interview_scheduled_on = today();
  base.stage_created_at = Date.now();
  DB.interview.unshift(base);
  saveAndRender();
}

function moveToPlacement(i){
  const base = {...DB.interview[i]};
  base.placement_date = today();
  base.stage_created_at = Date.now();
  DB.placement.unshift(base);
  saveAndRender();
}
function moveToStart(i){
  const base = {...DB.placement[i]};
  base.start_date = today();
  base.stage_created_at = Date.now();
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

function updateField(stage,index,field,value){
  DB[stage][index][field] = value;
  saveDB();
}

/* ================= STAGE RENDER ================= */

function renderStage(stage, bodyId){
  const body = document.getElementById(bodyId);
  if(!body) return;

  body.innerHTML="";

  const sorted = [...DB[stage]].sort((a,b)=>{

  const dateField =
    stage === "submission" ? "submission_date" :
    stage === "proposal" ? "proposal_date" :
    stage === "interview" ? "interview_scheduled_on" :
    stage === "placement" ? "placement_date" :
    stage === "start" ? "start_date" : "";

  return new Date(b[dateField]) - new Date(a[dateField]);
});

sorted.forEach((r,i)=>{

    let actionButtons="";

    if(stage==="submission"){
      actionButtons = `<button onclick="moveToInterview(${i})">Interview</button>`;
    }

   if(stage==="proposal"){
  actionButtons = `<button onclick="moveToInterview(${i})">Interview</button>`;
   }

    if(stage==="interview"){
  actionButtons = `<button onclick="moveToPlacement(${i})">Placement</button>`;
   }

    if(stage==="placement"){
  actionButtons = `<button onclick="moveToStart(${i})">Start</button>`;
   }

    if(stage==="start"){
  actionButtons = "";
   }

    body.innerHTML+=`
  <tr>
    <td>${i+1}</td>
<td>
  ${
    stage === "submission"
      ? `<input type="date"
          value="${r.submission_date || ''}"
          onchange="updateStageDate('submission',${i},this.value)">`
      : stage === "proposal"
      ? `<input type="date"
          value="${r.proposal_date || ''}"
          onchange="updateStageDate('proposal',${i},this.value)">`
      : stage === "interview"
      ? `<input type="date"
          value="${r.interview_scheduled_on || ''}"
          onchange="updateStageDate('interview',${i},this.value)">`
      : stage === "placement"
      ? `<input type="date"
          value="${r.placement_date || ''}"
          onchange="updateStageDate('placement',${i},this.value)">`
      : stage === "start"
      ? `<input type="date"
          value="${r.start_date || ''}"
          onchange="updateStageDate('start',${i},this.value)">`
      : ""
  }
</td>
    <td><input value="${r.name||""}"
      onchange="updateField('${stage}',${i},'name',this.value)"></td>

    <td><input value="${r.email||""}"
      onchange="updateField('${stage}',${i},'email',this.value)"></td>

    <td><input value="${r.phone||""}"
      onchange="updateField('${stage}',${i},'phone',this.value)"></td>

    <td><input value="${r.requirement||""}"
      onchange="updateField('${stage}',${i},'requirement',this.value)"></td>

    <td><input value="${r.client||""}"
      onchange="updateField('${stage}',${i},'client',this.value)"></td>

    <td><input value="${r.location||""}"
      onchange="updateField('${stage}',${i},'location',this.value)"></td>

    <td><input value="${r.visa||""}"
      onchange="updateField('${stage}',${i},'visa',this.value)"></td>

    <td>
      <input value="${r.notes||""}"
        onchange="updateField('${stage}',${i},'notes',this.value)">
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
  if(stage==="proposal") DB.proposal[i].proposal_date=val;
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

  const loginScreen = document.getElementById("loginScreen");
  const app = document.getElementById("app");

  if(session){

    if(loginScreen) loginScreen.style.display = "none";
    if(app) app.style.display = "block";

    loadDashboard();

  } else {

    if(loginScreen) loginScreen.style.display = "flex";
    if(app) app.style.display = "none";

  }
}

/* ================= PAGE LOAD ================= */

document.addEventListener("DOMContentLoaded", function(){

  checkUser();   // login/session check
  initTabs();    // ⭐ enable sidebar switching

  setInterval(()=>{
   backupToCloud();
  },300000);

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
    
/* ================= MASTER SAVE + REFRESH ================= */

function saveAndRender(){
  saveDB();

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