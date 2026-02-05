/* ================= LOGIN ================= */

function login(){
  if(username.value==="admin" && password.value==="admin"){
    localStorage.setItem("logged","yes");
    location.href="dashboard.html";
  } else {
    alert("Invalid Username or Password");
  }
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
  const d = get("jd");
  d.push({
    date: jdDate.value || today(),
    nvr: jdNvr.value,
    subject: jdSubject.value,
    text: jdText.value
  });
  set("jd", d);
  renderJD();
}

function renderJD(){
  jdTable.innerHTML="";
  get("jd").forEach((r,i)=>{
    jdTable.innerHTML += `
      <tr>
        <td>${r.date}</td>
        <td>${r.nvr}</td>
        <td class="subject-link" onclick="openJD(${i})">${r.subject}</td>
      </tr>`;
  });
}

function openJD(i){
  const r = get("jd")[i];
  jdModalTitle.innerText = r.subject;
  jdModalBody.innerText = r.text;
  new bootstrap.Modal(document.getElementById("jdModal")).show();
}

/* ================= RESUME → DAILY ================= */

function saveToDaily(){
  const d = get("daily");
  d.push({
    date: rpDate.value || today(),
    name: rpName.value,
    email: rpEmail.value,
    phone: rpPhone.value,
    job: rpJob.value,
    location: rpLocation.value,
    skills: rpSkills.value,
    visa: rpVisa.value,
    notes: rpNotes.value
  });
  set("daily", d);
  renderDaily();
}

/* ================= DAILY TASK ================= */

function renderDaily(q=""){
  dailyTable.innerHTML="";
  get("daily").forEach((r,i)=>{
    if(q && !r.email.includes(q) && !r.phone.includes(q)) return;
    dailyTable.innerHTML += `
    <tr>
      <td class="date-col">
        <input class="date-input" value="${r.date}"
        onblur="upd('daily',${i},'date',this.value)">
      </td>
      <td>${r.name}</td>
      <td>${r.email}</td>
      <td>${r.phone}</td>
      <td>${r.job}</td>
      <td>${r.location}</td>
      <td>${r.skills}</td>
      <td>${r.visa}</td>
      <td>
        <textarea onblur="upd('daily',${i},'notes',this.value)">
${r.notes || ""}
        </textarea>
      </td>
      <td>
        <button class="btn btn-sm btn-primary"
        onclick="route('daily','submission',${i})">Add</button>
        <button class="btn btn-sm btn-danger"
        onclick="del('daily',${i})">Delete</button>
      </td>
    </tr>`;
  });
  renderTargets();
  updateCounts();
}

/* ================= UPDATE / DELETE ================= */

function upd(tab,i,k,v){
  const d = get(tab);
  d[i][k] = v;
  set(tab, d);
}

function del(tab,i){
  const d = get(tab);
  d.splice(i,1);
  set(tab,d);
  renderDaily();
  renderTargets();
  updateCounts();
}

/* ================= ROUTING ================= */

function route(from,to,i){
  const d = get(to);
  d.push(get(from)[i]);
  set(to,d);
  renderTargets();
  updateCounts();
}

/* ================= TARGET TABLES ================= */

function renderTargets(){
  renderSubmission();
  renderSimple("proposal");
  renderSimple("interview");
  renderSimple("placement");
  renderSimple("start");
}

function renderSubmission(){
  submission.innerHTML = `
  <div class="table-responsive">
  <table class="table table-bordered">
  <thead>
    <tr>
      <th>Date</th><th>Name</th><th>Email</th><th>Job</th><th>Action</th>
    </tr>
  </thead>
  <tbody>
  ${get("submission").map((r,i)=>`
    <tr>
      <td><input value="${r.date}"
      onblur="upd('submission',${i},'date',this.value)"></td>
      <td>${r.name}</td>
      <td>${r.email}</td>
      <td>${r.job}</td>
      <td>
        <button class="btn btn-sm btn-warning"
        onclick="route('submission','proposal',${i})">Proposal</button>
        <button class="btn btn-sm btn-info"
        onclick="route('submission','interview',${i})">Interview</button>
        <button class="btn btn-sm btn-success"
        onclick="route('submission','placement',${i})">Placement</button>
        <button class="btn btn-sm btn-dark"
        onclick="route('submission','start',${i})">Start</button>
        <button class="btn btn-sm btn-danger"
        onclick="del('submission',${i})">Delete</button>
      </td>
    </tr>`).join("")}
  </tbody>
  </table></div>`;
}

function renderSimple(tab){
  document.getElementById(tab).innerHTML = `
  <div class="table-responsive">
  <table class="table table-bordered">
  <thead>
    <tr><th>Date</th><th>Name</th><th>Email</th><th>Job</th></tr>
  </thead>
  <tbody>
  ${get(tab).map((r,i)=>`
    <tr>
      <td><input value="${r.date}"
      onblur="upd('${tab}',${i},'date',this.value)"></td>
      <td>${r.name}</td>
      <td>${r.email}</td>
      <td>${r.job}</td>
    </tr>`).join("")}
  </tbody>
  </table></div>`;
}

/* ================= COUNTERS ================= */

function updateCounts(){
  subCount.innerText = get("submission").length;
  intCount.innerText = get("interview").length;
  placeCount.innerText = get("placement").length;
  startCount.innerText = get("start").length;
}

/* ================= EXCEL IMPORT ================= */

function importExcel(inp){
  const reader = new FileReader();
  reader.onload = e => {
    const wb = XLSX.read(e.target.result,{type:"binary"});
    const rows = XLSX.utils.sheet_to_json(
      wb.Sheets[wb.SheetNames[0]]
    );
    const d = get("daily");
    rows.forEach(r=>{
      d.push({
        date: today(),
        name: r["Applicant Name"] || "",
        email: r["Email Address"] || "",
        phone: r["Mobile Number"] || "",
        job: r["Job Applied"] || "",
        location: r["Job Location"] || "",
        skills: "",
        visa: "",
        notes: ""
      });
    });
    set("daily", d);
    renderDaily();
  };
  reader.readAsBinaryString(inp.files[0]);
}

/* ================= INIT ================= */

window.onload = ()=>{
  renderJD();
  renderDaily();
  updateCounts();
};
