/* =========================================================
   NETVISION ATS – FULL MASTER ENTERPRISE SCRIPT
   COMPLETE WORKFLOW VERSION
========================================================= */

/* ================= SUPABASE CONFIG ================= */

const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const $ = (id) => document.getElementById(id);
const today = () => new Date().toISOString().split("T")[0];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* =========================================================
   ROUTER
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  document.querySelectorAll("[data-tab]").forEach(tab => {
    tab.addEventListener("click", function () {

      document.querySelectorAll(".section")
        .forEach(sec => sec.classList.remove("active"));

      document.querySelectorAll(".sidebar a")
        .forEach(a => a.classList.remove("active"));

      this.classList.add("active");
      const id = this.dataset.tab;
      if ($(id)) $(id).classList.add("active");
    });
  });

  masterLoad();
});

/* =========================================================
   GENERIC FUNCTIONS
========================================================= */

async function del(table, id) {
  await supabase.from(table).delete().eq("id", id);
  await masterLoad();
}

async function copyRecord(fromTable, toTable, id, extraFields = {}) {

  const { data } = await supabase
    .from(fromTable)
    .select("*")
    .eq("id", id)
    .single();

  if (!data) return;

  const newObj = { ...data, ...extraFields };
  delete newObj.id;

  await supabase.from(toTable).insert([newObj]);
  await masterLoad();
}

/* =========================================================
   JD MODULE
========================================================= */

async function addJD() {
  await supabase.from("jd").insert([{
    date: $("jdDate").value,
    nvr: $("jdNvr").value,
    title: $("jdTitle").value,
    client: $("jdClient").value,
    status: $("jdStatus").value
  }]);

  await masterLoad();
}

async function loadJD() {

  const { data } = await supabase
    .from("jd")
    .select("*")
    .order("date", { ascending: false });

  $("jdBody").innerHTML = "";
  $("dailyRequirement").innerHTML = `<option value="">Select Requirement</option>`;

  data?.forEach(r => {

    $("jdBody").innerHTML += `
      <tr>
        <td>${r.date || ""}</td>
        <td>${r.nvr || ""}</td>
        <td>${r.title || ""}</td>
        <td>${r.client || ""}</td>
        <td>${r.status || ""}</td>
        <td>
          <button onclick="del('jd','${r.id}')">Del</button>
        </td>
      </tr>
    `;

    if (r.status === "Active") {
      $("dailyRequirement").innerHTML += `
        <option value="${r.nvr}" data-client="${r.client}">
          ${r.nvr} - ${r.title}
        </option>`;
    }
  });
}

$("dailyRequirement")?.addEventListener("change", function () {
  const selected = this.options[this.selectedIndex];
  const client = selected.getAttribute("data-client");
  $("dailyClient").value = client || "";
});

/* =========================================================
   DAILY MODULE
========================================================= */

async function addDaily() {

  await supabase.from("daily").insert([{
    entry_date: today(),
    name: $("dailyName").value,
    email: $("dailyEmail").value,
    phone: $("dailyPhone").value,
    visa: $("dailyVisa").value,
    requirement: $("dailyRequirement").value,
    client: $("dailyClient").value,
    source: $("dailySource").value,
    location: $("dailyLocation").value,
    notes: $("dailyNotes").value
  }]);

  await masterLoad();
}

async function loadDaily() {

  const { data } = await supabase
    .from("daily")
    .select("*")
    .order("entry_date", { ascending: false });

  $("dailyBody").innerHTML = "";

  data?.forEach(r => {

    $("dailyBody").innerHTML += `
      <tr>
        <td>${r.name}</td>
        <td>${r.requirement || ""}</td>
        <td>${r.client || ""}</td>
        <td>
          <button onclick="copyRecord('daily','submission','${r.id}',{submission_date:'${today()}'})">Sub</button>
          <button onclick="copyRecord('daily','proposal','${r.id}',{proposal_date:'${today()}'})">Proposal</button>
          <button onclick="del('daily','${r.id}')">Del</button>
        </td>
      </tr>
    `;
  });
}

/* =========================================================
   SUBMISSION MODULE
========================================================= */

async function loadSubmission() {

  const { data } = await supabase
    .from("submission")
    .select("*")
    .order("submission_date", { ascending: false });

  $("submissionBody").innerHTML = "";

  data?.forEach(r => {

    $("submissionBody").innerHTML += `
      <tr>
        <td>${r.submission_date || ""}</td>
        <td>${r.name}</td>
        <td>${r.client || ""}</td>
        <td>${r.pay_rate || ""}</td>
        <td>${r.notes || ""}</td>
        <td>
          <button onclick="copyRecord('submission','interview','${r.id}',{interview_scheduled_on:'${today()}',round:'1st'})">Interview</button>
          <button onclick="del('submission','${r.id}')">Del</button>
        </td>
      </tr>
    `;
  });
}

/* =========================================================
   PROPOSAL MODULE
========================================================= */

async function loadProposal() {

  const { data } = await supabase
    .from("proposal")
    .select("*")
    .order("proposal_date", { ascending: false });

  $("proposalBody").innerHTML = "";

  data?.forEach(r => {
    $("proposalBody").innerHTML += `
      <tr>
        <td>${r.proposal_date || ""}</td>
        <td>${r.name}</td>
        <td>${r.program_name || ""}</td>
        <td>${r.proposal_writer || ""}</td>
        <td>
          <button onclick="del('proposal','${r.id}')">Del</button>
        </td>
      </tr>
    `;
  });
}

/* =========================================================
   INTERVIEW MODULE
========================================================= */

async function loadInterview() {

  const { data } = await supabase
    .from("interview")
    .select("*")
    .order("interview_scheduled_on", { ascending: false });

  $("interviewBody").innerHTML = "";

  data?.forEach(r => {

    $("interviewBody").innerHTML += `
      <tr>
        <td>${r.interview_scheduled_on || ""}</td>
        <td>${r.name}</td>
        <td>${r.round || ""}</td>
        <td>${r.result || ""}</td>
        <td>
          <button onclick="copyRecord('interview','placement','${r.id}',{placement_date:'${today()}'})">Placement</button>
          <button onclick="del('interview','${r.id}')">Del</button>
        </td>
      </tr>
    `;
  });
}

/* =========================================================
   PLACEMENT MODULE
========================================================= */

async function loadPlacement() {

  const { data } = await supabase
    .from("placement")
    .select("*")
    .order("placement_date", { ascending: false });

  $("placementBody").innerHTML = "";

  data?.forEach(r => {

    $("placementBody").innerHTML += `
      <tr>
        <td>${r.placement_date || ""}</td>
        <td>${r.name}</td>
        <td>${r.offer_status || ""}</td>
        <td>
          <button onclick="copyRecord('placement','start','${r.id}',{start_date:'${today()}'})">Start</button>
          <button onclick="del('placement','${r.id}')">Del</button>
        </td>
      </tr>
    `;
  });
}

/* =========================================================
   START MODULE
========================================================= */

async function loadStart() {

  const { data } = await supabase
    .from("start")
    .select("*")
    .order("start_date", { ascending: false });

  $("startBody").innerHTML = "";

  data?.forEach(r => {

    $("startBody").innerHTML += `
      <tr>
        <td>${r.start_date || ""}</td>
        <td>${r.name}</td>
        <td>${r.client || ""}</td>
        <td>
          <button onclick="del('start','${r.id}')">Del</button>
        </td>
      </tr>
    `;
  });
}

/* =========================================================
   TASKS MODULE
========================================================= */

async function addTask() {
  await supabase.from("tasks").insert([{
    title: $("taskTitle").value,
    due_date: $("taskDue").value,
    status: "Pending"
  }]);
  await masterLoad();
}

async function loadTasks() {

  const { data } = await supabase
    .from("tasks")
    .select("*")
    .order("due_date", { ascending: true });

  $("taskBody").innerHTML = "";

  data?.forEach(t => {
    $("taskBody").innerHTML += `
      <tr>
        <td>${t.title}</td>
        <td>${t.due_date || ""}</td>
        <td>${t.status}</td>
        <td>
          ${t.status === "Pending"
            ? `<button onclick="supabase.from('tasks').update({status:'Completed'}).eq('id','${t.id}').then(masterLoad)">Complete</button>`
            : ""}
          <button onclick="del('tasks','${t.id}')">Del</button>
        </td>
      </tr>
    `;
  });
}

/* =========================================================
   MEETINGS MODULE
========================================================= */

async function addMeeting() {
  await supabase.from("meetings").insert([{
    meeting_date: $("meetingDate").value,
    title: $("meetingTitle").value
  }]);
  await masterLoad();
}

async function loadMeetings() {

  const { data } = await supabase
    .from("meetings")
    .select("*")
    .order("meeting_date", { ascending: false });

  $("meetingBody").innerHTML = "";

  data?.forEach(m => {
    $("meetingBody").innerHTML += `
      <tr>
        <td>${m.meeting_date || ""}</td>
        <td>${m.title}</td>
        <td>
          <button onclick="del('meetings','${m.id}')">Del</button>
        </td>
      </tr>
    `;
  });
}

/* =========================================================
   KPI ENGINE
========================================================= */

async function renderKPI() {

  const { data: sub } = await supabase.from("submission").select("submission_date");
  const { data: int } = await supabase.from("interview").select("interview_scheduled_on");
  const { data: place } = await supabase.from("placement").select("placement_date");
  const { data: start } = await supabase.from("start").select("start_date");

  $("kpiSub").innerText = sub?.length || 0;
  $("kpiInt").innerText = int?.length || 0;
  $("kpiPlace").innerText = place?.length || 0;
  $("kpiStart").innerText = start?.length || 0;

  const monthly = $("monthlyBody");
  monthly.innerHTML = "";

  for (let m = 0; m < 12; m++) {

    const subC = sub?.filter(r => r.submission_date && new Date(r.submission_date).getMonth() === m).length || 0;
    const intC = int?.filter(r => r.interview_scheduled_on && new Date(r.interview_scheduled_on).getMonth() === m).length || 0;
    const placeC = place?.filter(r => r.placement_date && new Date(r.placement_date).getMonth() === m).length || 0;
    const startC = start?.filter(r => r.start_date && new Date(r.start_date).getMonth() === m).length || 0;

    monthly.innerHTML += `
      <tr>
        <td>${MONTHS[m]}</td>
        <td>${subC}</td>
        <td>${intC}</td>
        <td>${placeC}</td>
        <td>${startC}</td>
      </tr>
    `;
  }
}

/* =========================================================
   MASTER LOAD
========================================================= */

async function masterLoad() {

  await loadJD();
  await loadDaily();
  await loadSubmission();
  await loadProposal();
  await loadInterview();
  await loadPlacement();
  await loadStart();
  await loadTasks();
  await loadMeetings();
  await renderKPI();
}