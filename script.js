/* ================= LOGIN ================= */

function login(){
  if(username.value==="admin" && password.value==="admin"){
    localStorage.setItem("logged","yes");
    location.href="dashboard.html";
  } else alert("Invalid Username or Password");
}

function checkLogin(){
  if(localStorage.getItem("logged")!=="yes"){
    location.href="index.html";
  }
}

function logout(){
  localStorage.removeItem("logged");
  location.href="index.html";
}

/* ================= STORAGE HELPERS ================= */

const get = k => JSON.parse(localStorage.getItem(k) || "[]");
const set = (k,v) => localStorage.setItem(k, JSON.stringify(v));
const today = () => new Date().toLocaleDateString("en-US");

/* ================= JOB DESCRIPTION ================= */

function saveJD(){
  const d=get("jd");
  d.push({
    date: jdDate.value||today(),
    nvr: jdNvr.value,
    subject: jdSubject.value,
    text: jdText.value
  });
  set("jd",d);
  renderJD();
}

function renderJD(){
  jdTable.innerHTML="";
  get("jd").forEach((r,i)=>{
    jdTable.innerHTML+=`
      <tr>
        <td style="width:110px">${r.date}</td>
        <td>${r.nvr}</td>
        <td class="subject-link" onclick="openJD(${i})">${r.subject}</td>
      </tr>`;
  });
}

function openJD(i){
  const r=get("jd")[i];
  jdModalTitle.innerText=r.subject;
  jdModalBody.innerText=r.text;
  new bootstrap.Modal(document.getElementById("jdModal")).show();
}

/* ================= RESUME → DAILY (MANUAL) ================= */

function saveToDaily(){
  const t=rpNotes.value||"";
  const email=(t.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)||[""])[0];
  const phone=(t.match(/(\+?\d{1,3}[\s-]?)?\d{10}/)||[""])[0];
  const lines=t.split("\n").map(l=>l.trim()).filter(l=>l);
  const name=lines[0]||"";
  const location=(t.match(/(Location|City|Based in)\s*[:\-]?\s*(.*)/i)||["",""])[2];
  const visa=(t.match(/(US Citizen|GC|Green Card|H1B|H-1B|OPT|CPT|EAD|L2|TN|Citizen)/i)||[""])[0];

  const d=get("daily");
  d.push({
    date: rpDate.value||today(),
    name,email,phone,
    job:"",location,skills:"",visa,
    notes:"",
    editing:false
  });
  set("daily",d);
  rpNotes.value="";
  renderAll();
}

/* ================= CEIPAL EXCEL IMPORT (FIXED) ================= */

function importCeipalExcel(input){
  const reader=new FileReader();
  reader.onload=e=>{
    const wb=XLSX.read(e.target.result,{type:"binary"});
    const rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    const d=get("daily");

    const pick = (row, keys) => {
      for (let k of keys) {
        if (row[k] && row[k].toString().trim()) {
          return row[k].toString().trim();
        }
      }
      return "";
    };

    rows.forEach(r=>{
      d.push({
        date: today(),
        name: pick(r, ["Applicant Name","Candidate Name","Applicant_Name"]),
        email: pick(r, ["Email Address","Email","Email ID"]),
        phone: pick(r, ["Mobile Number","Phone","Phone Number"]),
        job:"",
        location: pick(r, ["Location","Current Location","City"]),
        skills:"",
        visa:"",
        notes:"",
        editing:false
      });
    });

    set("daily",d);
    renderAll();
  };
  reader.readAsBinaryString(input.files[0]);
}

/* ================= EDIT CONTROL ================= */

function toggleEdit(tab,i){
  const d=get(tab);
  d.forEach((r,idx)=>r.editing = idx===i ? !r.editing : false);
  set(tab,d);
  renderAll();
}

function upd(tab,i,k,v){
  const d=get(tab);
  d[i][k]=v;
  set(tab,d);
}

/* ================= DAILY ================= */

function renderDaily(){
  dailyTable.innerHTML="";
  get("daily").forEach((r,i)=>{
    dailyTable.innerHTML+=`
    <tr>
      ${cell(r.date,r.editing,'daily',i,'date')}
      ${cell(r.name,r.editing,'daily',i,'name')}
      ${cell(r.email,r.editing,'daily',i,'email')}
      ${cell(r.phone,r.editing,'daily',i,'phone')}
      ${cell(r.job,r.editing,'daily',i,'job')}
      ${cell(r.location,r.editing,'daily',i,'location')}
      ${cell(r.skills,r.editing,'daily',i,'skills')}
      ${cell(r.visa,r.editing,'daily',i,'visa')}
      <td>
        <textarea ${r.editing?"":"disabled"}
          oninput="upd('daily',${i},'notes',this.value)">${r.notes}</textarea>
      </td>
      <td>
        <button class="btn btn-sm ${r.editing?'btn-success':'btn-primary'}"
          onclick="toggleEdit('daily',${i})">${r.editing?'Save':'Edit'}</button>
        <button class="btn btn-sm btn-secondary"
          onclick="route('daily','submission',${i})">Add</button>
        <button class="btn btn-sm btn-danger"
          onclick="del('daily',${i})">DEL</button>
      </td>
    </tr>`;
  });
}

/* ================= ROUTING ================= */

function route(from,to,i){
  const row={...get(from)[i],editing:false};
  if(to==="submission") row.ceipalId="";
  if(to==="proposal"){
    row.clientName="";
    row.programName="";
    row.pwName="";
  }
  const d=get(to);
  d.push(row);
  set(to,d);
  renderAll();
}

/* ================= SUBMISSION ================= */

function renderSubmission(){
  submission.innerHTML=`
  <table class="table table-bordered">
    <tr>
      <th style="width:110px">Date</th>
      <th>Name</th>
      <th>Email</th>
      <th>Job</th>
      <th style="width:120px">Ceipal ID</th>
      <th style="width:240px">Action</th>
    </tr>
    ${get("submission").map((r,i)=>`
    <tr>
      ${cell(r.date,r.editing,'submission',i,'date')}
      <td>${r.name}</td>
      <td>${r.email}</td>
      ${cell(r.job,r.editing,'submission',i,'job')}
      ${cell(r.ceipalId,r.editing,'submission',i,'ceipalId')}
      <td>
        <button class="btn btn-sm btn-primary" onclick="route('submission','proposal',${i})">PRO</button>
        <button class="btn btn-sm btn-info" onclick="route('submission','interview',${i})">INT</button>
        <button class="btn btn-sm btn-success" onclick="route('submission','placement',${i})">OFF</button>
        <button class="btn btn-sm btn-dark" onclick="route('submission','start',${i})">STA</button>
        <button class="btn btn-sm ${r.editing?'btn-success':'btn-warning'}"
          onclick="toggleEdit('submission',${i})">${r.editing?'Save':'Edit'}</button>
        <button class="btn btn-sm btn-danger" onclick="del('submission',${i})">DEL</button>
      </td>
    </tr>`).join("")}
  </table>`;
}

/* ================= PROPOSAL ================= */

function renderProposal(){
  proposal.innerHTML=`
  <table class="table table-bordered">
    <tr>
      <th style="width:110px">Date</th><th>Name</th><th>Email</th><th>Job</th>
      <th>Client</th><th>Program</th><th>PW</th>
      <th style="width:120px">Action</th>
    </tr>
    ${get("proposal").map((r,i)=>`
    <tr>
      ${cell(r.date,r.editing,'proposal',i,'date')}
      <td>${r.name}</td>
      <td>${r.email}</td>
      ${cell(r.job,r.editing,'proposal',i,'job')}
      ${cell(r.clientName,r.editing,'proposal',i,'clientName')}
      ${cell(r.programName,r.editing,'proposal',i,'programName')}
      ${cell(r.pwName,r.editing,'proposal',i,'pwName')}
      <td>
        <button class="btn btn-sm ${r.editing?'btn-success':'btn-warning'}"
          onclick="toggleEdit('proposal',${i})">${r.editing?'Save':'Edit'}</button>
        <button class="btn btn-sm btn-danger" onclick="del('proposal',${i})">DEL</button>
      </td>
    </tr>`).join("")}
  </table>`;
}

/* ================= INTERVIEW / PLACEMENT / START ================= */

function renderStage(tab){
  document.getElementById(tab).innerHTML=`
  <table class="table table-bordered">
    <tr>
      <th style="width:110px">Date</th><th>Name</th><th>Email</th><th>Job</th>
      <th style="width:120px">Action</th>
    </tr>
    ${get(tab).map((r,i)=>`
    <tr>
      ${cell(r.date,r.editing,tab,i,'date')}
      <td>${r.name}</td>
      <td>${r.email}</td>
      ${cell(r.job,r.editing,tab,i,'job')}
      <td>
        <button class="btn btn-sm ${r.editing?'btn-success':'btn-warning'}"
          onclick="toggleEdit('${tab}',${i})">${r.editing?'Save':'Edit'}</button>
        <button class="btn btn-sm btn-danger" onclick="del('${tab}',${i})">DEL</button>
      </td>
    </tr>`).join("")}
  </table>`;
}

/* ================= HELPERS ================= */

function cell(val,edit,tab,i,key){
  return `<td><input value="${val||""}" ${edit?"":"disabled"}
    oninput="upd('${tab}',${i},'${key}',this.value)"></td>`;
}

function del(tab,i){
  const d=get(tab);
  d.splice(i,1);
  set(tab,d);
  renderAll();
}

/* ================= COUNTERS ================= */

function updateCounts(){
  subCount.innerText=get("submission").length;
  intCount.innerText=get("interview").length;
  placeCount.innerText=get("placement").length;
  startCount.innerText=get("start").length;
}

/* ================= RENDER ALL ================= */

function renderAll(){
  renderJD();
  renderDaily();
  renderSubmission();
  renderProposal();
  ["interview","placement","start"].forEach(renderStage);
  updateCounts();
}

/* ================= INIT ================= */

window.onload=renderAll;
