/* ==========================================================
   SAFE GLOBAL SETUP
========================================================== */

const el = (id) => document.getElementById(id);
const now = () => new Date().toISOString();

/* ==========================================================
   SUPABASE CONNECTION (SAFE)
========================================================== */

let supabaseClient = null;

if (typeof supabase !== "undefined") {
  const SUPABASE_URL = "https://jpmmciputroyyrjmyeya.supabase.co";
  const SUPABASE_KEY = "sb_publishable_afZSYp99Z_Xwb5Wl_W7J8g_m7fPHPTE";
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} else {
  console.log("Supabase not loaded (OK on login page)");
}

/* ==========================================================
   LOGIN SYSTEM
========================================================== */

function login() {

  const userField = el("username");
  const passField = el("password");

  if (!userField || !passField) return;

  const u = userField.value.trim();
  const p = passField.value.trim();

  if (u === "admin" && p === "admin") {
    localStorage.setItem("logged", "yes");
    window.location.href = "dashboard.html";
  } else {
    alert("Invalid Username or Password");
  }
}

function checkLogin() {
  if (localStorage.getItem("logged") !== "yes") {
    window.location.href = "index.html";
  }
}

function logout() {
  localStorage.removeItem("logged");
  window.location.href = "index.html";
}

/* ==========================================================
   LOAD ACTIVE JDs
========================================================== */

async function loadActiveJDs() {

  if (!supabaseClient) return;

  const select = el("dailyJobSelect");
  if (!select) return;

  const { data, error } = await supabaseClient
    .from("jd")
    .select("*")
    .eq("jdstatus", "Active");

  if (error) {
    console.error(error);
    return;
  }

  select.innerHTML = `<option value="">Select Active Requirement</option>`;

  (data || []).forEach(j => {
    select.innerHTML += `
      <option value="${j.jdsubject}">
        ${j.jdsubject}
      </option>`;
  });
}

/* ==========================================================
   CLIENT MASTER
========================================================== */

async function loadClients() {

  if (!supabaseClient) return;

  const select = el("dailyClientSelect");
  if (!select) return;

  const { data, error } = await supabaseClient
    .from("clients")
    .select("*")
    .order("client_name");

  if (error) {
    console.error(error);
    return;
  }

  select.innerHTML = `<option value="">Select Client</option>`;

  (data || []).forEach(c => {
    select.innerHTML += `
      <option value="${c.client_name}">
        ${c.client_name}
      </option>`;
  });
}

async function addClient() {

  if (!supabaseClient) return;

  const input = el("newClientInput");
  if (!input) return;

  const name = input.value.trim();
  if (!name) return alert("Enter client name");

  const { error } = await supabaseClient
    .from("clients")
    .insert([{ client_name: name }]);

  if (error) {
    alert("Client may already exist");
    return;
  }

  input.value = "";
  loadClients();
}

/* ==========================================================
   RESUME PARSER
========================================================== */

function parseResume(text) {

  if (!text) return;

  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if (emailMatch && el("rpEmail")) el("rpEmail").value = emailMatch[0];

  const phoneMatch = text.match(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch && el("rpPhone")) el("rpPhone").value = phoneMatch[0];
}

/* ==========================================================
   SAVE DAILY
========================================================== */

async function saveToDaily() {

  if (!supabaseClient) return;

  if (!el("dailyJobSelect")?.value)
    return alert("Select Active Requirement");

  if (!el("dailyClientSelect")?.value)
    return alert("Select Client");

  const row = {
    date: now(),
    name: el("rpName")?.value || "",
    email: el("rpEmail")?.value || "",
    phone: el("rpPhone")?.value || "",
    job: el("dailyJobSelect").value,
    client: el("dailyClientSelect").value,
    location: el("rpLocation")?.value || "",
    visa: el("rpVisa")?.value || "",
    notes: el("rpNotes")?.value || ""
  };

  const { error } = await supabaseClient
    .from("daily")
    .insert([row]);

  if (error) {
    alert(error.message);
    return;
  }

  loadDaily();
}

/* ==========================================================
   COPY FUNCTIONS
========================================================== */

async function copyToStage(id, target) {

  if (!supabaseClient) return;

  const { data } = await supabaseClient
    .from("daily")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) return;

  delete data.id;

  await supabaseClient.from(target).insert([data]);

  loadStage(target);
  updateKPIs();
}

async function copyBetweenStages(source, id, target) {

  if (!supabaseClient) return;

  const { data } = await supabaseClient
    .from(source)
    .select("*")
    .eq("id", id)
    .single();

  if (!data) return;

  delete data.id;

  await supabaseClient.from(target).insert([data]);

  loadStage(target);
  updateKPIs();
}

/* ==========================================================
   DELETE
========================================================== */

async function deleteRow(table, id) {

  if (!supabaseClient) return;
  if (!confirm("Delete entry?")) return;

  await supabaseClient.from(table).delete().eq("id", id);

  if (table === "daily") loadDaily();
  else loadStage(table);

  updateKPIs();
}

/* ==========================================================
   UPDATE
========================================================== */

async function updateDate(table, id, value) {
  if (!supabaseClient) return;
  await supabaseClient.from(table).update({ date: value }).eq("id", id);
}

async function updateNotes(table, id, value) {
  if (!supabaseClient) return;
  await supabaseClient.from(table).update({ notes: value }).eq("id", id);
}

/* ==========================================================
   LOAD DAILY
========================================================== */

async function loadDaily() {

  if (!supabaseClient) return;

  const table = el("dailyTable");
  if (!table) return;

  const { data } = await supabaseClient
    .from("daily")
    .select("*")
    .order("id", { ascending: false });

  table.innerHTML = "";

  (data || []).forEach((r, i) => {

    table.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>
          <input type="date"
            value="${r.date ? r.date.split("T")[0] : ""}"
            onchange="updateDate('daily',${r.id},this.value)">
        </td>
        <td>${r.name || ""}</td>
        <td>${r.email || ""}</td>
        <td>${r.phone || ""}</td>
        <td>${r.job || ""}</td>
        <td>${r.client || ""}</td>
        <td>${r.location || ""}</td>
        <td>${r.visa || ""}</td>
        <td>
          <textarea onchange="updateNotes('daily',${r.id},this.value)">
            ${r.notes || ""}
          </textarea>
        </td>
        <td>
          <button onclick="copyToStage(${r.id},'submission')">Submission</button>
          <button onclick="copyToStage(${r.id},'proposal')">Proposal</button>
          <button onclick="deleteRow('daily',${r.id})">Delete</button>
        </td>
      </tr>`;
  });

  updateKPIs();
}

/* ==========================================================
   LOAD STAGES
========================================================== */

async function loadStage(tab) {

  if (!supabaseClient) return;

  const container = el(tab);
  if (!container) return;

  const { data } = await supabaseClient
    .from(tab)
    .select("*")
    .order("id", { ascending: false });

  container.innerHTML = `
  <table class="table table-bordered">
    <thead>
      <tr>
        <th>Date</th>
        <th>Name</th>
        <th>Email</th>
        <th>Job</th>
        <th>Client</th>
        <th>Notes</th>
        ${tab === "submission" ? "<th>Move</th>" : ""}
        <th>Delete</th>
      </tr>
    </thead>
    <tbody>
      ${(data || []).map(r => `
        <tr>
          <td>
            <input type="date"
              value="${r.date ? r.date.split("T")[0] : ""}"
              onchange="updateDate('${tab}',${r.id},this.value)">
          </td>
          <td>${r.name || ""}</td>
          <td>${r.email || ""}</td>
          <td>${r.job || ""}</td>
          <td>${r.client || ""}</td>
          <td>
            <textarea onchange="updateNotes('${tab}',${r.id},this.value)">
              ${r.notes || ""}
            </textarea>
          </td>
          ${tab === "submission" ? `
          <td>
            <button onclick="copyBetweenStages('submission',${r.id},'interview')">Interview</button>
            <button onclick="copyBetweenStages('submission',${r.id},'placement')">Placement</button>
            <button onclick="copyBetweenStages('submission',${r.id},'start')">Start</button>
          </td>` : ""}
          <td>
            <button onclick="deleteRow('${tab}',${r.id})">Delete</button>
          </td>
        </tr>
      `).join("")}
    </tbody>
  </table>`;
}

/* ==========================================================
   KPI
========================================================== */

async function updateKPIs() {

  if (!supabaseClient) return;

  const sub = await supabaseClient.from("submission").select("*");
  const int = await supabaseClient.from("interview").select("*");
  const pla = await supabaseClient.from("placement").select("*");
  const sta = await supabaseClient.from("start").select("*");

  if (el("subCount")) el("subCount").innerText = sub.data?.length || 0;
  if (el("intCount")) el("intCount").innerText = int.data?.length || 0;
  if (el("placeCount")) el("placeCount").innerText = pla.data?.length || 0;
  if (el("startCount")) el("startCount").innerText = sta.data?.length || 0;
}

/* ==========================================================
   INIT
========================================================== */

window.addEventListener("load", () => {

  if (el("dailyTable")) {

    checkLogin();

    loadActiveJDs();
    loadClients();
    loadDaily();
    loadStage("submission");
    loadStage("proposal");
    loadStage("interview");
    loadStage("placement");
    loadStage("start");
  }
});
