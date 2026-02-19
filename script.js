/* ============================================================
   NETVISION ATS – COMPLETE STABLE MASTER ENGINE
   Clean Flow | Stable DB | Full Stage Control
============================================================ */

/* ================== CONSTANTS ================== */

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun",
                "Jul","Aug","Sep","Oct","Nov","Dec"];

/* ================== DATABASE ================== */

let DB = JSON.parse(localStorage.getItem("ATS_DB")) || {
  jd: [],
  daily: [],
  submission: [],
  proposal: [],
  interview: [],
  placement: [],
  start: []
};

function saveDB(){
  localStorage.setItem("ATS_DB", JSON.stringify(DB));
}

function today(){
  return new Date().toISOString().split("T")[0];
}

/* ================== TAB SWITCH ================== */

function switchTab(id){
  document.querySelectorAll(".section").forEach(s=>s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

/* ================== JD ================== */

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

/* ================== RESUME ================== */

function parseResume(){

  const txt = resumeText.value.trim();

  const email = txt.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phone = txt.match(/\+?\d[\d\-\s]{8,}/);
  const lines = txt.split("\n").map(x=>x.trim()).filter(Boolean);

  const name = lines[0] || "";
  const location = lines.find(l=>l.includes(",")) || "";

  resumeName.value = name;
  resumeEmail.value = email?email[0]:"";
  resumePhone.value = phone?phone[0]:"";
  resumeLocation.value = location;

  // Mirror to Daily
  dailyName.value = name;
  dailyEmail.value = email?email[0]:"";
  dailyPhone.value = phone?phone[0]:"";
  dailyLocation.value = location;
}

/* ================== DAILY ================== */

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
  dailyNotes.value="";
  resumeText.value="";
}

function renderDaily(){
  dailyBody.innerHTML="";
  DB.daily.forEach((r,i)=>{
    dailyBody.innerHTML+=`
      <tr>
        <td>${i+1}</td>
        <td>${r.entry_date}</td>
        <td>${r.name}</td>
        <td>${r.email}</td>
        <td>${r.phone}</td>
        <td>${r.requirement}</td>
        <td>${r.client}</td>
        <td>${r.location}</td>
        <td>${r.visa}</td>
        <td>
          <input value="${r.notes||""}"
            onchange="updateNote('daily',${i},this.value)">
        </td>
        <td>
          <button onclick="moveToSubmission(${i})">Sub</button>
          <button onclick="moveToProposal(${i})">Proposal</button>
          <button onclick="deleteRow('daily',${i})">Del</button>
        </td>
      </tr>`;
  });
}

/* ================== STAGE MOVEMENT ================== */

function moveToSubmission(index){
  const base = {...DB.daily[index]};
  base.submission_date = today();
  DB.submission.unshift(base);
  saveAndRender();
}

function moveToProposal(index){
  const base = {...DB.daily[index]};
  base.proposal_date = today();
  DB.proposal.unshift(base);
  saveAndRender();
}

function moveToInterview(index){
  const base = {...DB.submission[index]};
  base.interview_scheduled_on = today();
  DB.interview.unshift(base);
  saveAndRender();
}

function moveToPlacement(index){
  const base = {...DB.interview[index]};
  base.placement_date = today();
  DB.placement.unshift(base);
  saveAndRender();
}

function moveToStart(index){
  const base = {...DB.placement[index]};
  base.start_date = today();
  DB.start.unshift(base);
  saveAndRender();
}

/* ================== GENERIC DELETE ================== */

function deleteRow(tab,index){
  DB[tab].splice(index,1);
  saveAndRender();
}

function updateNote(tab,index,val){
  DB[tab][index].notes = val;
  saveDB();
}

/* ================== STAGE RENDER ================== */

function renderStage(stage, bodyId){

  const body = document.getElementById(bodyId);
  body.innerHTML="";

  DB[stage].forEach((r,i)=>{

    let actionButton = "";

    if(stage==="submission"){
      actionButton = `<button onclick="moveToInterview(${i})">Interview</button>`;
    }
    if(stage==="interview"){
      actionButton = `<button onclick="moveToPlacement(${i})">Placement</button>`;
    }
    if(stage==="placement"){
      actionButton = `<button onclick="moveToStart(${i})">Start</button>`;
    }

    body.innerHTML+=`
      <tr>
        <td>${i+1}</td>
        <td>
          <input type="date"
            value="${r.submission_date||r.interview_scheduled_on||r.placement_date||r.start_date||""}"
            onchange="updateStageDate('${stage}',${i},this.value)">
        </td>
        <td>${r.name||""}</td>
        <td>${r.email||""}</td>
        <td>${r.phone||""}</td>
        <td>${r.requirement||""}</td>
        <td>${r.client||""}</td>
        <td>${r.location||""}</td>
        <td>${r.visa||""}</td>
        <td>
          <input value="${r.notes||""}"
            onchange="updateNote('${stage}',${i},this.value)">
        </td>
        <td>
          ${actionButton}
          <button onclick="deleteRow('${stage}',${i})">Del</button>
        </td>
      </tr>`;
  });
}

function updateStageDate(stage,index,val){

  if(stage==="submission") DB.submission[index].submission_date = val;
  if(stage==="interview") DB.interview[index].interview_scheduled_on = val;
  if(stage==="placement") DB.placement[index].placement_date = val;
  if(stage==="start") DB.start[index].start_date = val;

  saveAndRender();
}

/* ================== KPI ================== */

function renderKPI(){

  kpiSub.innerText = DB.submission.length;
  kpiInt.innerText = DB.interview.length;
  kpiPlace.innerText = DB.placement.length;
  kpiStart.innerText = DB.start.length;

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

/* ================== MASTER RENDER ================== */

function saveAndRender(){
  saveDB();
  renderAll();
}

function renderAll(){
  renderJD();
  renderDaily();
  renderStage("submission","submissionBody");
  renderStage("proposal","proposalBody");
  renderStage("interview","interviewBody");
  renderStage("placement","placementBody");
  renderStage("start","startBody");
  renderKPI();
}

/* ================== INIT ================== */

renderAll();
