/* =========================================================
   SUPABASE CONFIG
========================================================= */

const SUPABASE_URL = "https://jpmmciputroyyrjmyeya.supabase.co";
const SUPABASE_KEY = "sb_publishable_afZSYp99Z_Xwb5Wl_W7J8g_m7fPHPTE";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const el = (id) => document.getElementById(id);
const now = () => new Date().toISOString();

/* =========================================================
   LOGIN
========================================================= */

function login() {
  const user = el("username")?.value;
  const pass = el("password")?.value;

  if (user === "admin" && pass === "admin") {
    localStorage.setItem("logged", "yes");
    location.href = "dashboard.html";
  } else {
    alert("Invalid Login");
  }
}

function logout() {
  localStorage.removeItem("logged");
  location.href = "index.html";
}

function checkLogin() {
  if (localStorage.getItem("logged") !== "yes") {
    location.href = "index.html";
  }
}

/* =========================================================
   TAB SWITCH
========================================================= */

function switchTab(tabId, ref) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.getElementById(tabId).classList.add("active");

  document.querySelectorAll(".nav-link").forEach(n => n.classList.remove("active"));
  if (ref) ref.classList.add("active");

  renderTab(tabId);
}

/* =========================================================
   KPI + MONTHLY REPORT
========================================================= */

async function updateKPIs() {
  const sub = await supabaseClient.from("submission").select("id");
  const int = await supabaseClient.from("interview").select("id");
  const pla = await supabaseClient.from("placement").select("id");
  const sta = await supabaseClient.from("start").select("id");

  el("subCount").innerText = sub.data?.length || 0;
  el("intCount").innerText = int.data?.length || 0;
  el("placeCount").innerText = pla.data?.length || 0;
  el("startCount").innerText = sta.data?.length || 0;

  renderMonthly();
}

async function renderMonthly() {
  const year = new Date().getFullYear();
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const tables = ["submission","interview","placement","start"];

  const responses = await Promise.all(
    tables.map(t => supabaseClient.from(t).select("date"))
  );

  const tbody = el("yearlyReportTable");
  if (!tbody) return;

  tbody.innerHTML = "";

  months.forEach((m, i) => {
    function count(arr) {
      return (arr || []).filter(r => {
        if (!r.date) return false;
        const d = new Date(r.date);
        return d.getFullYear() === year && d.getMonth() === i;
      }).length;
    }

    tbody.innerHTML += `
      <tr>
        <td>${m}</td>
        <td>${count(responses[0].data)}</td>
        <td>${count(responses[1].data)}</td>
        <td>${count(responses[2].data)}</td>
        <td>${count(responses[3].data)}</td>
      </tr>
    `;
  });
}

async function refreshDashboard() {
  await updateKPIs();
}

/* =========================================================
   GENERIC DELETE
========================================================= */

async function deleteRow(table, id, reloadFn) {
  await supabaseClient.from(table).delete().eq("id", id);
  if (reloadFn) reloadFn();
  refreshDashboard();
}

/* =========================================================
   GENERIC UPDATE
========================================================= */

async function updateRow(table, id, data, reloadFn) {
  await supabaseClient.from(table).update(data).eq("id", id);
  if (reloadFn) reloadFn();
  refreshDashboard();
}

/* =========================================================
   RENDER CONTROLLER
========================================================= */

function renderTab(tabId) {
  switch(tabId) {
    case "jd": renderJD(); break;
    case "resume": renderResume(); break;
    case "daily": renderDaily(); break;
    case "submission": renderSubmission(); break;
    case "proposal": renderProposal(); break;
    case "interview": renderInterview(); break;
    case "placement": renderPlacement(); break;
    case "start": renderStart(); break;
  }
}

/* =========================================================
   INIT
========================================================= */

async function initDashboard() {
  checkLogin();
  await updateKPIs();
}
/* =========================================================
   JD TAB
========================================================= */

async function renderJD() {
  const container = el("jd");

  container.innerHTML = `
    <h5>Add Job Description</h5>

    <input id="jd_nvr" class="form-control mb-2" placeholder="NVR ID">
    <input id="jd_subject" class="form-control mb-2" placeholder="Job Title">
    <textarea id="jd_text" class="form-control mb-2" placeholder="Description"></textarea>
    <select id="jd_status" class="form-control mb-2">
      <option value="Active">Active</option>
      <option value="Hold">Hold</option>
      <option value="Closed">Closed</option>
    </select>
    <button class="btn btn-primary mb-3" onclick="addJD()">Save JD</button>

    <hr>

    <h5>JD List</h5>
    <table class="table table-bordered">
      <thead>
        <tr>
          <th>SL</th>
          <th>Date</th>
          <th>NVR</th>
          <th>Title</th>
          <th>Status</th>
          <th>Delete</th>
        </tr>
      </thead>
      <tbody id="jdBody"></tbody>
    </table>
  `;

  loadJD();
}

async function addJD() {
  await supabaseClient.from("jd").insert({
    date: now(),
    jdnvr: el("jd_nvr").value,
    jdsubject: el("jd_subject").value,
    jdtext: el("jd_text").value,
    jdstatus: el("jd_status").value
  });

  renderJD();
}

async function loadJD() {
  const { data } = await supabaseClient.from("jd").select("*").order("id",{ascending:false});
  const body = el("jdBody");
  body.innerHTML = "";

  data.forEach((row, index) => {
    body.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${new Date(row.date).toLocaleDateString()}</td>
        <td>${row.jdnvr}</td>
        <td>${row.jdsubject}</td>
        <td>${row.jdstatus}</td>
        <td><button class="btn btn-sm btn-danger" onclick="deleteRow('jd',${row.id},renderJD)">X</button></td>
      </tr>
    `;
  });
}

/* =========================================================
   RESUME TAB (Manual + Parse)
========================================================= */

async function renderResume() {
  const container = el("resume");

  const { data: jdList } = await supabaseClient
    .from("jd")
    .select("*")
    .eq("jdstatus","Active");

  const options = jdList.map(j => `<option value="${j.jdsubject}">${j.jdsubject}</option>`).join("");

  container.innerHTML = `
    <h5>Resume Entry</h5>

    <label>Active Requirement</label>
    <select id="res_job" class="form-control mb-2">
      <option value="">Select JD</option>
      ${options}
    </select>

    <label>Name</label>
    <input id="res_name" class="form-control mb-2">

    <label>Email</label>
    <input id="res_email" class="form-control mb-2">

    <label>Phone</label>
    <input id="res_phone" class="form-control mb-2">

    <label>Location</label>
    <input id="res_location" class="form-control mb-2">

    <label>Visa</label>
    <select id="res_visa" class="form-control mb-2">
      <option>US Citizen</option>
      <option>Green Card</option>
      <option>EAD</option>
      <option>H1B</option>
      <option>OPT</option>
    </select>

    <label>Source</label>
    <select id="res_source" class="form-control mb-2">
      <option>LinkedIn</option>
      <option>Dice</option>
      <option>Monster</option>
      <option>CareerBuilder</option>
      <option>Referral</option>
      <option>Internal DB</option>
      <option>Vendor</option>
      <option>Other</option>
    </select>

    <label>Resume Text (Parse Mode)</label>
    <textarea id="resume_text" class="form-control mb-2" rows="4"></textarea>

    <button class="btn btn-secondary mb-2" onclick="parseResume()">Parse</button>
    <button class="btn btn-primary" onclick="saveToDaily()">Save To Daily</button>
  `;
}

function parseResume() {
  const text = el("resume_text").value;

  const email = text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i);
  const phone = text.match(/\b\d{10}\b/);

  if (email) el("res_email").value = email[0];
  if (phone) el("res_phone").value = phone[0];

  const lines = text.split("\n").filter(l => l.trim() !== "");
  if (lines.length > 0) el("res_name").value = lines[0];
}

async function saveToDaily() {
  if (!el("res_name").value || !el("res_job").value) {
    alert("Name and JD required");
    return;
  }

  await supabaseClient.from("daily").insert({
    date: now(),
    name: el("res_name").value,
    email: el("res_email").value,
    phone: el("res_phone").value,
    job: el("res_job").value,
    client: "",
    source: el("res_source").value,
    location: el("res_location").value,
    visa: el("res_visa").value,
    followup: "",
    notes: ""
  });

  renderResume();
}

/* =========================================================
   DAILY TAB (Enterprise Editable)
========================================================= */

async function renderDaily() {
  const container = el("daily");

  container.innerHTML = `
    <h5>Daily Candidates</h5>

    <table class="table table-bordered">
      <thead>
        <tr>
          <th>SL</th>
          <th>Name</th>
          <th>Email</th>
          <th>Phone</th>
          <th>Job</th>
          <th>Visa</th>
          <th>Date</th>
          <th>Notes</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="dailyBody"></tbody>
    </table>
  `;

  loadDaily();
}

async function loadDaily() {
  const { data } = await supabaseClient.from("daily").select("*").order("id",{ascending:false});
  const body = el("dailyBody");
  body.innerHTML = "";

  data.forEach((row, index) => {
    body.innerHTML += `
      <tr id="dailyRow${row.id}">
        <td>${index + 1}</td>
        <td>${row.name}</td>
        <td>${row.email || ''}</td>
        <td>${row.phone || ''}</td>
        <td>${row.job}</td>
        <td>${row.visa || ''}</td>
        <td>${row.date ? row.date.split("T")[0] : ''}</td>
        <td>${row.notes || ''}</td>
        <td>
          <button class="btn btn-sm btn-info" onclick="editDaily(${row.id})">Edit</button>
          <button class="btn btn-sm btn-primary" onclick="moveToSubmission(${row.id})">Submission</button>
          <button class="btn btn-sm btn-warning" onclick="moveToProposal(${row.id})">Proposal</button>
          <button class="btn btn-sm btn-danger" onclick="deleteRow('daily',${row.id},renderDaily)">X</button>
        </td>
      </tr>
    `;
  });
}

async function editDaily(id) {
  const { data } = await supabaseClient.from("daily").select("*").eq("id",id).single();
  const row = document.getElementById(`dailyRow${id}`);

  row.innerHTML = `
    <td>#</td>
    <td><input id="d_name${id}" value="${data.name}"></td>
    <td><input id="d_email${id}" value="${data.email || ''}"></td>
    <td><input id="d_phone${id}" value="${data.phone || ''}"></td>
    <td>${data.job}</td>
    <td>${data.visa || ''}</td>
    <td><input type="date" id="d_date${id}" value="${data.date.split("T")[0]}"></td>
    <td><textarea id="d_notes${id}">${data.notes || ''}</textarea></td>
    <td>
      <button class="btn btn-sm btn-success" onclick="saveDaily(${id})">Save</button>
    </td>
  `;
}

async function saveDaily(id) {
  await updateRow("daily", id, {
    name: el(`d_name${id}`).value,
    email: el(`d_email${id}`).value,
    phone: el(`d_phone${id}`).value,
    date: el(`d_date${id}`).value,
    notes: el(`d_notes${id}`).value
  }, renderDaily);
}
/* =========================================================
   SUBMISSION TAB (Control Hub)
========================================================= */

async function renderSubmission() {
  const container = el("submission");

  container.innerHTML = `
    <h5>Submission</h5>
    <table class="table table-bordered">
      <thead>
        <tr>
          <th>SL</th>
          <th>Name</th>
          <th>Email</th>
          <th>Phone</th>
          <th>Job</th>
          <th>Visa</th>
          <th>Date</th>
          <th>Notes</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="subBody"></tbody>
    </table>
  `;

  loadSubmission();
}

async function loadSubmission() {
  const { data } = await supabaseClient.from("submission").select("*").order("id",{ascending:false});
  const body = el("subBody");
  body.innerHTML = "";

  data.forEach((row, index) => {
    body.innerHTML += `
      <tr id="subRow${row.id}">
        <td>${index + 1}</td>
        <td>${row.name}</td>
        <td>${row.email || ''}</td>
        <td>${row.phone || ''}</td>
        <td>${row.job}</td>
        <td>${row.visa || ''}</td>
        <td>${row.date ? row.date.split("T")[0] : ''}</td>
        <td>${row.notes || ''}</td>
        <td>
          <button class="btn btn-sm btn-info" onclick="editSubmission(${row.id})">Edit</button>
          <button class="btn btn-sm btn-secondary" onclick="moveToInterview(${row.id})">Interview</button>
          <button class="btn btn-sm btn-success" onclick="moveToPlacement(${row.id})">Placement</button>
          <button class="btn btn-sm btn-dark" onclick="moveToStart(${row.id})">Start</button>
          <button class="btn btn-sm btn-danger" onclick="deleteRow('submission',${row.id},renderSubmission)">X</button>
        </td>
      </tr>
    `;
  });
}

async function editSubmission(id) {
  const { data } = await supabaseClient.from("submission").select("*").eq("id",id).single();
  const row = document.getElementById(`subRow${id}`);

  row.innerHTML = `
    <td>#</td>
    <td><input id="s_name${id}" value="${data.name}"></td>
    <td><input id="s_email${id}" value="${data.email || ''}"></td>
    <td><input id="s_phone${id}" value="${data.phone || ''}"></td>
    <td>${data.job}</td>
    <td>${data.visa || ''}</td>
    <td><input type="date" id="s_date${id}" value="${data.date.split("T")[0]}"></td>
    <td><textarea id="s_notes${id}">${data.notes || ''}</textarea></td>
    <td><button class="btn btn-sm btn-success" onclick="saveSubmission(${id})">Save</button></td>
  `;
}

async function saveSubmission(id) {
  await updateRow("submission", id, {
    name: el(`s_name${id}`).value,
    email: el(`s_email${id}`).value,
    phone: el(`s_phone${id}`).value,
    date: el(`s_date${id}`).value,
    notes: el(`s_notes${id}`).value
  }, renderSubmission);
}

/* =========================================================
   MOVE FUNCTIONS (COPY MODE)
========================================================= */

async function moveToInterview(id) {
  const { data } = await supabaseClient.from("submission").select("*").eq("id",id).single();

  await supabaseClient.from("interview").insert({
    date: now(),
    name: data.name,
    email: data.email,
    phone: data.phone,
    job: data.job,
    client: data.client,
    location: data.location,
    visa: data.visa,
    interview_scheduled_on: null,
    notes: ""
  });

  refreshDashboard();
}

async function moveToPlacement(id) {
  const { data } = await supabaseClient.from("submission").select("*").eq("id",id).single();

  await supabaseClient.from("placement").insert({
    date: now(),
    name: data.name,
    email: data.email,
    phone: data.phone,
    job: data.job,
    client: data.client,
    location: data.location,
    visa: data.visa,
    notes: ""
  });

  refreshDashboard();
}

async function moveToStart(id) {
  const { data } = await supabaseClient.from("submission").select("*").eq("id",id).single();

  await supabaseClient.from("start").insert({
    date: now(),
    name: data.name,
    email: data.email,
    phone: data.phone,
    job: data.job,
    client: data.client,
    location: data.location,
    visa: data.visa,
    start_date: null,
    notes: ""
  });

  refreshDashboard();
}

/* =========================================================
   PROPOSAL TAB
========================================================= */

async function renderProposal() {
  const container = el("proposal");

  container.innerHTML = `
    <h5>Proposal</h5>
    <table class="table table-bordered">
      <thead>
        <tr>
          <th>SL</th>
          <th>Name</th>
          <th>Email</th>
          <th>Phone</th>
          <th>Job</th>
          <th>Program</th>
          <th>Date</th>
          <th>Notes</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="propBody"></tbody>
    </table>
  `;

  loadProposal();
}

async function loadProposal() {
  const { data } = await supabaseClient.from("proposal").select("*").order("id",{ascending:false});
  const body = el("propBody");
  body.innerHTML = "";

  data.forEach((row,index) => {
    body.innerHTML += `
      <tr id="propRow${row.id}">
        <td>${index+1}</td>
        <td>${row.name}</td>
        <td>${row.email || ''}</td>
        <td>${row.phone || ''}</td>
        <td>${row.job}</td>
        <td>${row.program_name || ''}</td>
        <td>${row.date.split("T")[0]}</td>
        <td>${row.notes || ''}</td>
        <td>
          <button class="btn btn-sm btn-info" onclick="editProposal(${row.id})">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteRow('proposal',${row.id},renderProposal)">X</button>
        </td>
      </tr>
    `;
  });
}

async function editProposal(id) {
  const { data } = await supabaseClient.from("proposal").select("*").eq("id",id).single();
  const row = document.getElementById(`propRow${id}`);

  row.innerHTML = `
    <td>#</td>
    <td><input id="p_name${id}" value="${data.name}"></td>
    <td><input id="p_email${id}" value="${data.email || ''}"></td>
    <td><input id="p_phone${id}" value="${data.phone || ''}"></td>
    <td>${data.job}</td>
    <td><input id="p_program${id}" value="${data.program_name || ''}"></td>
    <td><input type="date" id="p_date${id}" value="${data.date.split("T")[0]}"></td>
    <td><textarea id="p_notes${id}">${data.notes || ''}</textarea></td>
    <td><button class="btn btn-sm btn-success" onclick="saveProposal(${id})">Save</button></td>
  `;
}

async function saveProposal(id) {
  await updateRow("proposal", id, {
    name: el(`p_name${id}`).value,
    email: el(`p_email${id}`).value,
    phone: el(`p_phone${id}`).value,
    program_name: el(`p_program${id}`).value,
    date: el(`p_date${id}`).value,
    notes: el(`p_notes${id}`).value
  }, renderProposal);
}
