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

function saveToDaily() {
  const resumeText = rpNotes.value || "";

  /* ===== EMAIL ===== */
  const emailMatch = resumeText.match(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
  );
  const email = emailMatch ? emailMatch[0] : "";

  /* ===== PHONE ===== */
  const phoneMatch = resumeText.match(
    /(\+?\d{1,3}[\s-]?)?\d{10}/
  );
  const phone = phoneMatch ? phoneMatch[0] : "";

  /* ===== NAME (FIRST NON-EMPTY LINE) ===== */
  const lines = resumeText
    .split("\n")
    .map(l => l.trim())
    .filter(l => l);
  const name = lines.length > 0 ? lines[0] : "";

  /* ===== LOCATION ===== */
  const locationMatch = resumeText.match(
    /(Location|City|Based in)\s*[:\-]?\s*(.*)/i
  );
  const location = locationMatch ? locationMatch[2] : "";

  /* ===== VISA / WORK AUTH ===== */
  const visaMatch = resumeText.match(
    /(US Citizen|GC|Green Card|H1B|H-1B|OPT|CPT|EAD|L2|TN|Citizen)/i
  );
  const visa = visaMatch ? visaMatch[0] : "";

  const d = get("daily");

  d.push({
    date: rpDate.value || today(),
    name: name,
    email: email,
    phone: phone,
    job: "",
    location: location,
    skills: "",
    visa: visa,
    notes: ""          // ✅ NOTES MANUAL ONLY
  });

  set("daily", d);

  // Clear resume box after saving
  rpNotes.value = "";

  renderDaily();
}


/* ================= DAILY TASK ================= */

function renderDaily(q=""){
  dailyTable.innerHTML="";

  get("daily").forEach((r,i)=>{
    if(q && !r.email.includes(q) && !r.phone.includes(q)) return;

    dailyTable.innerHTML += `
    <tr>
      <td>${r.date}</td>

      <td>
        <input class="form-control form-control-sm"
          value="${r.name}"
          onblur="updateDaily(${i},'name',this.value)">
      </td>

      <td>
        <input class="form-control form-control-sm"
          value="${r.email}"
          onblur="updateDaily(${i},'email',this.value)">
      </td>

      <td>
        <input class="form-control form-control-sm"
          value="${r.phone}"
          onblur="updateDaily(${i},'phone',this.value)">
      </td>

      <td>
        <input class="form-control form-control-sm"
          value="${r.location}"
          onblur="updateDaily(${i},'location',this.value)">
      </td>

      <td>
        <input class="form-control form-control-sm"
          value="${r.visa}"
          onblur="updateDaily(${i},'visa',this.value)">
      </td>

      <td>
        <textarea class="form-control form-control-sm"
          onblur="updateDaily(${i},'notes',this.value)">${r.notes || ""}</textarea>
      </td>

      <td>
        <button class="btn btn-primary btn-sm"
          onclick="move('daily','submission',${i})">Add</button>
        <button class="btn btn-danger btn-sm"
          onclick="del('daily',${i})">Delete</button>
      </td>
    </tr>`;
  });
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
