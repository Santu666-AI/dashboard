/* ===============================
   NETVISION ATS – MASTER OFFLINE
   =============================== */

const db = {
  jd: JSON.parse(localStorage.getItem("jd") || "[]"),
  resume: JSON.parse(localStorage.getItem("resume") || "[]"),
  daily: JSON.parse(localStorage.getItem("daily") || "[]"),
  submission: JSON.parse(localStorage.getItem("submission") || "[]"),
  proposal: JSON.parse(localStorage.getItem("proposal") || "[]"),
  interview: JSON.parse(localStorage.getItem("interview") || "[]"),
  placement: JSON.parse(localStorage.getItem("placement") || "[]"),
  start: JSON.parse(localStorage.getItem("start") || "[]")
};

function saveAll(){
  Object.keys(db).forEach(k=>{
    localStorage.setItem(k, JSON.stringify(db[k]));
  });
  updateKPI();
  renderMonthly();
}

/* ================= TAB SWITCH ================= */

function switchTab(id){
  document.querySelectorAll(".section").forEach(s=>s.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  document.querySelectorAll(".sidebar a").forEach(a=>a.classList.remove("active"));
  event.target.classList.add("active");

  renderAll();
}

/* ================= HELPERS ================= */

function today(){ return new Date().toISOString().split("T")[0]; }
function month(d){ return new Date(d).getMonth(); }
function year(d){ return new Date(d).getFullYear(); }

/* ================= JD ================= */

function addJD(){
  const nvr = jdNvr.value.trim();
  if(db.jd.some(j=>j.nvr===nvr)){ alert("Duplicate NVR"); return; }

  db.jd.push({
    nvr,
    title: jdTitle.value,
    client: jdClient.value,
    desc: jdDesc.value,
    status: jdStatus.value,
    date: today()
  });

  jdNvr.value=jdTitle.value=jdClient.value=jdDesc.value="";
  saveAll();
  renderJD();
  loadActiveJD();
}

function renderJD(){
  jdBody.innerHTML="";
  db.jd.forEach((j,i)=>{
    jdBody.innerHTML+=`
    <tr>
      <td>${i+1}</td>
      <td>${j.nvr}</td>
      <td>${j.title}</td>
      <td>${j.client}</td>
      <td>${j.status}</td>
      <td>${j.date}</td>
    </tr>`;
  });
}

function loadActiveJD(){
  dailyJob.innerHTML="";
  db.jd.filter(j=>j.status==="Active")
  .forEach(j=>{
    dailyJob.innerHTML+=`<option value="${j.nvr}">${j.title}</option>`;
  });
}

dailyJob?.addEventListener("change",()=>{
  const selected = db.jd.find(j=>j.nvr===dailyJob.value);
  if(selected) dailyClient.value = selected.client;
});

/* ================= RESUME ================= */

function parseResume(){
  const text = resumeText.value;
  const email = text.match(/\S+@\S+\.\S+/);
  const phone = text.match(/\b\d{10}\b/);
  const name = text.split("\n")[0];

  db.resume.push({
    name:name || "",
    email:email?email[0]:"",
    phone:phone?phone[0]:"",
    visa:resumeVisa.value,
    date:today(),
    raw:text
  });

  saveAll();
  renderResume();
}

function renderResume(){
  resumeBody.innerHTML="";
  db.resume.forEach((r,i)=>{
    resumeBody.innerHTML+=`
    <tr>
      <td>${i+1}</td>
      <td>${r.name}</td>
      <td>${r.email}</td>
      <td>${r.visa}</td>
      <td>${r.date}</td>
      <td><button onclick="deleteResume(${i})">Delete</button></td>
    </tr>`;
  });
}

function deleteResume(i){
  db.resume.splice(i,1);
  saveAll();
  renderResume();
}

/* ================= DAILY ================= */

function addDaily(){
  db.daily.push({
    date:today(),
    name:dailyName.value,
    email:dailyEmail.value,
    phone:dailyPhone.value,
    job:dailyJob.value,
    client:dailyClient.value,
    source:dailySource.value,
    location:dailyLocation.value,
    visa:dailyVisa.value,
    notes:dailyNotes.value
  });

  saveAll();
  renderDaily();
}

function renderDaily(){
  dailyBody.innerHTML="";
  db.daily.forEach((d,i)=>{
    dailyBody.innerHTML+=`
    <tr>
      <td>${i+1}</td>
      <td>${d.date}</td>
      <td>${d.name}</td>
      <td>${d.job}</td>
      <td>${d.client}</td>
      <td>${d.source}</td>
      <td>
        <button onclick="copyTo('submission',${i})">To Sub</button>
        <button onclick="copyTo('proposal',${i})">To Proposal</button>
      </td>
    </tr>`;
  });
}

/* ================= COPY ENGINE ================= */

function copyTo(stage,i){
  const item = {...db.daily[i]};
  if(stage==="proposal") item.program="";
  db[stage].push(item);
  saveAll();
  renderAll();
}

/* ================= SUBMISSION ================= */

function renderSubmission(){
  submissionBody.innerHTML="";
  db.submission.forEach((s,i)=>{
    submissionBody.innerHTML+=`
    <tr>
      <td>${i+1}</td>
      <td><input type="date" value="${s.date}" onchange="editSubDate(${i},this.value)"></td>
      <td>${s.name}</td>
      <td>${s.job}</td>
      <td>${s.client}</td>
      <td>
        <button onclick="copyFromSub('interview',${i})">To Interview</button>
        <button onclick="copyFromSub('placement',${i})">To Placement</button>
      </td>
    </tr>`;
  });
}

function editSubDate(i,val){
  db.submission[i].date=val;
  saveAll();
}

function copyFromSub(stage,i){
  db[stage].push({...db.submission[i]});
  saveAll();
  renderAll();
}

/* ================= PROPOSAL ================= */

function renderProposal(){
  proposalBody.innerHTML="";
  db.proposal.forEach((p,i)=>{
    proposalBody.innerHTML+=`
    <tr>
      <td>${i+1}</td>
      <td>${p.date}</td>
      <td>${p.name}</td>
      <td><input value="${p.program||""}" onchange="db.proposal[${i}].program=this.value;saveAll()"></td>
      <td><button onclick="deleteRow('proposal',${i})">Delete</button></td>
    </tr>`;
  });
}

/* ================= INTERVIEW ================= */

function renderInterview(){
  interviewBody.innerHTML="";
  db.interview.forEach((iv,i)=>{
    interviewBody.innerHTML+=`
    <tr>
      <td>${i+1}</td>
      <td>${iv.date}</td>
      <td><input type="date" value="${iv.interviewOn||today()}" onchange="db.interview[${i}].interviewOn=this.value;saveAll()"></td>
      <td>${iv.name}</td>
      <td>
        <button onclick="copyFromInterview(${i})">To Placement</button>
        <button onclick="deleteRow('interview',${i})">Delete</button>
      </td>
    </tr>`;
  });
}

function copyFromInterview(i){
  db.placement.push({...db.interview[i]});
  saveAll();
  renderAll();
}

/* ================= PLACEMENT ================= */

function renderPlacement(){
  placementBody.innerHTML="";
  db.placement.forEach((p,i)=>{
    placementBody.innerHTML+=`
    <tr>
      <td>${i+1}</td>
      <td>${p.date}</td>
      <td>${p.name}</td>
      <td>
        <button onclick="copyFromPlacement(${i})">To Start</button>
        <button onclick="deleteRow('placement',${i})">Delete</button>
      </td>
    </tr>`;
  });
}

function copyFromPlacement(i){
  db.start.push({...db.placement[i], startOn:today()});
  saveAll();
  renderAll();
}

/* ================= START ================= */

function renderStart(){
  startBody.innerHTML="";
  db.start.forEach((s,i)=>{
    startBody.innerHTML+=`
    <tr>
      <td>${i+1}</td>
      <td>${s.date}</td>
      <td><input type="date" value="${s.startOn||today()}" onchange="db.start[${i}].startOn=this.value;saveAll()"></td>
      <td>${s.name}</td>
      <td><button onclick="deleteRow('start',${i})">Delete</button></td>
    </tr>`;
  });
}

/* ================= DELETE ================= */

function deleteRow(stage,i){
  db[stage].splice(i,1);
  saveAll();
  renderAll();
}

/* ================= KPI ================= */

function updateKPI(){
  kpiSub.innerText=db.submission.length;
  kpiInt.innerText=db.interview.length;
  kpiPlace.innerText=db.placement.length;
  kpiStart.innerText=db.start.length;
}

/* ================= MONTHLY ================= */

function renderMonthly(){
  const yr=parseInt(yearSelect.value);
  monthlyBody.innerHTML="";
  const months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  for(let m=0;m<12;m++){
    const sub=db.submission.filter(x=>year(x.date)===yr && month(x.date)===m).length;
    const intv=db.interview.filter(x=>x.interviewOn && year(x.interviewOn)===yr && month(x.interviewOn)===m).length;
    const place=db.placement.filter(x=>year(x.date)===yr && month(x.date)===m).length;
    const start=db.start.filter(x=>x.startOn && year(x.startOn)===yr && month(x.startOn)===m).length;

    monthlyBody.innerHTML+=`
    <tr>
      <td>${months[m]}</td>
      <td>${sub}</td>
      <td>${intv}</td>
      <td>${place}</td>
      <td>${start}</td>
    </tr>`;
  }
}

/* ================= INIT ================= */

function initYear(){
  const current=new Date().getFullYear();
  for(let y=2026;y<=current+3;y++){
    yearSelect.innerHTML+=`<option>${y}</option>`;
  }
  yearSelect.value=current;
}

function renderAll(){
  renderJD();
  renderResume();
  renderDaily();
  renderSubmission();
  renderProposal();
  renderInterview();
  renderPlacement();
  renderStart();
}

document.addEventListener("DOMContentLoaded",()=>{
  initYear();
  loadActiveJD();
  renderAll();
  updateKPI();
  renderMonthly();
});
