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

/* ================= DOM ELEMENT REFERENCES ================= */

const jdBody = $("jdBody");
const dailyBody = $("dailyBody");
const submissionBody = $("submissionBody");
const proposalBody = $("proposalBody");
const interviewBody = $("interviewBody");
const placementBody = $("placementBody");
const startBody = $("startBody");

const kpiSub = $("kpiSub");
const kpiInt = $("kpiInt");
const kpiPlace = $("kpiPlace");
const kpiStart = $("kpiStart");

const monthlyBody = $("monthlyBody");

const taskList = $("taskList");
const meetingList = $("meetingList");

function uid(){
  return Date.now() + Math.floor(Math.random() * 1000);
}

console.log("Supabase Connected Successfully");

/* ── EARLY STUBS: prevent "not defined" if buttons clicked before script fully loads ── */
window.importCeipal        = function(){ document.getElementById("ceipalFileInput")?.click(); };
window.importGeneric       = function(tab){ document.getElementById("importFile_"+tab)?.click(); };

/* ── EXACT columns per table — only these are sent to Supabase ── */
const TABLE_COLS = {
  daily: ['entry_date', 'name', 'email', 'phone', 'requirement', 'client', 'location', 'visa', 'source', 'notes', 'resume_text', 'ai_score', 'ai_notes'],
  submission: ['submission_date', 'name', 'email', 'phone', 'requirement', 'client', 'location', 'visa', 'notes'],
  proposal: ['proposal_date', 'name', 'email', 'phone', 'requirement', 'client', 'program_name', 'pw_name', 'location', 'visa', 'notes'],
  interview: ['interview_scheduled_on', 'name', 'email', 'phone', 'requirement', 'client', 'location', 'visa', 'interview_round', 'interview_status', 'status_notes', 'notes'],
  placement: ['placement_date', 'name', 'email', 'phone', 'requirement', 'client', 'location', 'visa', 'offer_status', 'notes'],
  start: ['start_date', 'name', 'email', 'phone', 'requirement', 'client', 'location', 'visa', 'notes'],
};


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


let DB = {
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



/* ================= PAGINATION ================= */

const PAGE_SIZE = 50;

const paginationState = {
  daily: 1,
  submission: 1,
  proposal: 1,
  interview: 1,
  placement: 1,
  start: 1
};
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
  console.log("saveDB disabled – Supabase mode active");
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

let _addJDLock = false;

async function addJD(){

  if(_addJDLock) return;
  _addJDLock = true;

  const dateEl   = document.getElementById("jdDate");
  const nvrEl    = document.getElementById("jdNvr");
  const titleEl  = document.getElementById("jdTitle");
  const clientEl = document.getElementById("jdClient");
  const textEl   = document.getElementById("jdText");
  const statusEl = document.getElementById("jdStatus");
  const btn      = document.querySelector("button[onclick='addJD()']");

  if(btn){ btn.disabled = true; btn.textContent = "Saving..."; }

  const nvrInput = nvrEl.value.trim();

  if(!titleEl.value.trim()){
    alert("Job Title is required");
    _addJDLock = false;
    if(btn){ btn.disabled = false; btn.innerHTML = '<i class="ri-add-line"></i> Add JD'; }
    return;
  }

  /* ── DUPLICATE NVR CHECK ── */
  if(nvrInput){
    const duplicate = DB.jd.find(j => j.nvr && j.nvr.trim().toLowerCase() === nvrInput.toLowerCase());
    if(duplicate){
      const proceed = confirm(
        "⚠️ Duplicate NVR Detected!\n\n" +
        "NVR: " + nvrInput + "\n" +
        "Existing Job: " + (duplicate.title || "—") + "\n" +
        "Client: " + (duplicate.client || "—") + "\n" +
        "Status: " + (duplicate.status || "—") + "\n\n" +
        "This NVR already exists. Do you still want to save it?"
      );
      if(!proceed){
        _addJDLock = false;
        if(btn){ btn.disabled = false; btn.innerHTML = '<i class="ri-add-line"></i> Add JD'; }
        return;
      }
    }
  }

  const record = {
    date:     dateEl.value || today(),
    nvr:      nvrInput || null,
    title:    titleEl.value.trim(),
    client:   clientEl.value.trim(),
    jd_text:  textEl.value.trim(),
    status:   statusEl.value
  };

  const { error } = await sb.from("jd").insert([record]);

  if(error){
    alert("Failed to add JD: " + error.message);
    _addJDLock = false;
    if(btn){ btn.disabled = false; btn.innerHTML = '<i class="ri-add-line"></i> Add JD'; }
    return;
  }

  /* Clear form */
  dateEl.value   = "";
  nvrEl.value    = "";
  titleEl.value  = "";
  clientEl.value = "";
  textEl.value   = "";
  statusEl.value = "Active";

  await fetchAllData();
  renderJD();
  populateRequirementDropdown();

  _addJDLock = false;
  if(btn){ btn.disabled = false; btn.innerHTML = '<i class="ri-add-line"></i> Add JD'; }
}

async function updateJDStatus(i,val){
  const record = DB.jd[i];
  record.status = val;

  if(record.id){
    await sb.from("jd").update({ status: val }).eq("id", record.id);
  }

  await fetchAllData();
  renderJD();
  populateRequirementDropdown();
}

function renderJD(){
  if(!jdBody) return;

  jdBody.innerHTML = "";

  DB.jd.forEach((r,i)=>{

    if(r.isEditing){

      jdBody.innerHTML += `
        <tr>
          <td>${i+1}</td>
          <td>${r.date}</td>
          <td>
            <input value="${r.nvr || ""}"
              onchange="updateJDField(${i},'nvr',this.value)">
          </td>
          <td>
            <input value="${r.title || ""}"
              onchange="updateJDField(${i},'title',this.value)">
          </td>
          <td>
            <input value="${r.client || ""}"
              onchange="updateJDField(${i},'client',this.value)">
          </td>
          <td>
            <select onchange="updateJDField(${i},'status',this.value)">
              <option ${r.status==="Active"?"selected":""}>Active</option>
              <option ${r.status==="Hold"?"selected":""}>Hold</option>
              <option ${r.status==="Closed"?"selected":""}>Closed</option>
            </select>
          </td>
          <td>
            <button onclick="saveJDRow(${i})">Save</button>
            <button onclick="deleteJD(${i})">Delete</button>
          </td>
        </tr>
      `;

    } else {

     jdBody.innerHTML += `
<tr>
  <td>${i+1}</td>
  <td>${r.date}</td>
  <td>${r.nvr || ""}</td>

  <td>
    <a href="#" onclick="viewJD(${i})" style="color:#1a73e8;font-weight:600;text-decoration:none;">
      ${r.title || ""}
    </a>
  </td>

  <td>${r.client || ""}</td>
  <td>${r.status || ""}</td>

  <td>
    <button onclick="editJD(${i})">Edit</button>
    <button onclick="deleteJD(${i})">Delete</button>
  </td>
</tr>
`;
    }

  });
}

/* ================= JD EDIT FUNCTIONS ================= */

function editJD(index){
  DB.jd[index].isEditing = true;
  renderJD();
}

function updateJDField(index,field,value){
  DB.jd[index][field] = value;
}

async function saveJDRow(index){
  const record = DB.jd[index];
  record.isEditing = false;

  if(record.id){
    const { error } = await sb.from("jd").update({
      nvr: record.nvr,
      title: record.title,
      client: record.client,
      status: record.status
    }).eq("id", record.id);

    if(error){
      alert("Save failed: " + error.message);
      return;
    }
  }

  await fetchAllData();
  renderJD();
  populateRequirementDropdown();
}

async function deleteJD(i){

  const record = DB.jd[i];

  if(!record?.id){
    alert("Record ID missing");
    return;
  }

  if(!confirm("Delete this JD?")) return;

  const { error } = await sb.from("jd").delete().eq("id", record.id);

  if(error){
    alert("Delete failed: " + error.message);
    return;
  }

  await fetchAllData();

  renderJD();
  populateRequirementDropdown();
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

/* ================= UPDATE DATE (INLINE EDIT) ================= */

async function updateDate(stage, id, value){
  if(!id) return;

  const dateFieldMap = {
    daily:      "entry_date",
    submission: "submission_date",
    proposal:   "proposal_date",
    interview:  "interview_scheduled_on",
    placement:  "placement_date",
    start:      "start_date"
  };

  const field = dateFieldMap[stage];
  if(!field) return;

  const updateObj = {};
  updateObj[field] = value;

  const { error } = await sb.from(stage).update(updateObj).eq("id", id);

  if(error){
    alert("Date update failed: " + error.message);
    return;
  }

  /* Update local DB so KPI re-render is accurate */
  const record = DB[stage] ? DB[stage].find(r => r.id === id) : null;
  if(record) record[field] = value;

  renderKPI();
}

/* ================= UPDATE NOTE (INLINE EDIT) ================= */

async function updateNote(stage, index, value){
  const record = DB[stage][index];
  if(!record || !record.id) return;
  record.notes = value;
  await sb.from(stage).update({ notes: value }).eq("id", record.id);
}

async function updateNoteById(stage, id, value){
  if(!id) return;
  const { error } = await sb.from(stage).update({ notes: value }).eq("id", id);
  if(error){ console.error("Note save failed:", error.message); return; }
  const record = DB[stage] ? DB[stage].find(r => r.id === id) : null;
  if(record) record.notes = value;
}

async function updateFieldById(stage, id, field, value){
  if(!id) return;
  const update = {}; update[field] = value;
  const { error } = await sb.from(stage).update(update).eq("id", id);
  if(error){ console.error(`Field save failed (${field}):`, error.message); return; }
  const record = DB[stage] ? DB[stage].find(r => r.id === id) : null;
  if(record) record[field] = value;
}

/* ================= DAILY ================= */

function autoFillClient(){
  const selected = dailyRequirement.value;
  const jd = DB.jd.find(j => j.title === selected);
  if(jd){
    dailyClient.value = jd.client;
  }
}

function populateRequirementDropdown(){
  if(!dailyRequirement) return;

  dailyRequirement.innerHTML = '<option value="">Select Requirement</option>';

  DB.jd.forEach(j=>{
    dailyRequirement.innerHTML += `
      <option value="${j.title}">
        ${j.title}
      </option>`;
  });
}

/* =====================================
   DAILY SAVE FUNCTION - FINAL VERSION
===================================== */

async function saveDaily(){

  /* ✅ REQUIRED FIELD VALIDATION */
  if(!dailyName.value || !dailyEmail.value){
    alert("Name & Email required");
    return;
  }

  /* ✅ CREATE DAILY RECORD */
 const record = {
  id: crypto.randomUUID(), 
  entry_date: today(),
  name: dailyName.value.trim(),
  email: dailyEmail.value.trim(),
  phone: dailyPhone.value.trim(),
  requirement: dailyRequirement.value,
  client: dailyClient.value,
  location: dailyLocation.value,
  visa: dailyVisa.value,
  source: dailySource.value,
  notes: dailyNotes.value,
  resume_text: resumeText.value || window._parsedResumeText || ""
};
window._parsedResumeText = ""; /* clear after use */

  /* ✅ INSERT INTO DATABASE */
 await sb.from("daily").insert([record]);
 await fetchAllData();

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

  dailyBody.innerHTML = "";

  const todayDate  = today();
  const currentPage = paginationState.daily || 1;

  /* ── 1. Flatten all records sorted: newest date first, newest entry first within day ── */
  const allRecords = [...DB.daily].sort((a, b) => {
    const dateDiff = new Date(b.entry_date) - new Date(a.entry_date);
    if (dateDiff !== 0) return dateDiff;
    return DB.daily.indexOf(b) - DB.daily.indexOf(a);
  });

  const totalRecords = allRecords.length;
  const totalPages   = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const safePage     = Math.min(currentPage, totalPages);
  paginationState.daily = safePage;

  /* ── 2. Slice for current page ── */
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const pageRecs = allRecords.slice(startIdx, startIdx + PAGE_SIZE);

  /* ── 3. Group sliced records by date for display headers ── */
  const grouped = {};
  pageRecs.forEach(r => {
    if (!grouped[r.entry_date]) grouped[r.entry_date] = [];
    grouped[r.entry_date].push(r);
  });

  /* Global row counter for this page (1-based, continuous) */
  let rowNum = startIdx + 1;

  Object.keys(grouped)
    .sort((a, b) => new Date(b) - new Date(a))
    .forEach(date => {
      const isToday = date === todayDate;
      dailyBody.innerHTML += `
        <tr class="date-row ${isToday ? "today-row" : ""}">
          <td colspan="14">${formatDisplayDate(date)}</td>
        </tr>`;

      grouped[date].forEach(r => {
        dailyBody.innerHTML += `
          <tr>
            <td>${rowNum++}</td>
            <td>
              <input type="date" value="${r.entry_date||""}"
                style="background:#0f172a;border:1px solid #1f2a3a;color:#f1f5f9;border-radius:6px;padding:4px 6px;font-size:12px;width:130px;"
                onchange="updateDate('daily','${r.id}',this.value)">
            </td>
            <td>
              <a href="#" onclick="viewResume(${DB.daily.indexOf(r)})" style="color:#1a73e8;font-weight:600;text-decoration:none;">${r.name||""}</a>
            </td>
            <td>${r.email||""}</td>
            <td>${r.phone||""}</td>
            <td>${r.requirement||""}</td>
            <td>${r.client||""}</td>
            <td>${r.location||""}</td>
            <td>${r.visa||""}</td>
            <td>${r.source||""}</td>
            <td>
              <input value="${r.notes||""}" placeholder="Add notes..."
                style="background:#0f172a;border:1px solid #1f2a3a;color:#f1f5f9;border-radius:6px;padding:4px 8px;font-size:12px;width:160px;"
                onchange="updateNoteById('daily','${r.id}',this.value)">
            </td>
            <td>
              ${r.ai_score != null && r.ai_score !== ""
                ? `<span id="score_${r.id}" style="
                    display:inline-block;padding:3px 10px;border-radius:20px;font-size:13px;font-weight:700;
                    background:${r.ai_score>=80?'rgba(16,185,129,0.15)':r.ai_score>=60?'rgba(245,158,11,0.15)':'rgba(239,68,68,0.15)'};
                    color:${r.ai_score>=80?'#10b981':r.ai_score>=60?'#f59e0b':'#ef4444'};
                    border:1px solid ${r.ai_score>=80?'rgba(16,185,129,0.3)':r.ai_score>=60?'rgba(245,158,11,0.3)':'rgba(239,68,68,0.3)'};
                  ">${r.ai_score}%</span>`
                : `<button id="score_${r.id}" onclick="scoreCandidate('${r.id}')"
                    style="background:rgba(139,92,246,0.15);color:#a78bfa;border:1px solid rgba(139,92,246,0.3);
                      padding:4px 10px;border-radius:7px;font-size:11px;font-weight:600;">
                    ✦ Score
                  </button>`
              }
            </td>
            <td style="max-width:200px;font-size:11.5px;color:#94a3b8;white-space:pre-wrap;">${r.ai_notes || ""}</td>
            <td>
              <button onclick="moveDailyToSubmission('${r.id}')">Sub</button>
              <button onclick="moveDailyToProposal('${r.id}')">Proposal</button>
              <button onclick="deleteRow('daily',${DB.daily.indexOf(r)})">Del</button>
            </td>
          </tr>`;
      });
    });

  /* ── 4. Render pagination bar BELOW the table ── */
  renderDailyPagination(safePage, totalPages, totalRecords);

  /* ── 5. Sync bottom scroll bar width ── */
  setTimeout(syncDailyScrollBar, 50);
}

function buildDailyPagBars(){
  // Top bar — above the scroll wrapper
  if(!document.getElementById("dailyPagBarTop")){
    const barTop = document.createElement("div");
    barTop.id = "dailyPagBarTop";
    barTop.style.cssText = "display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:0 0 12px;";
    const wrapper = document.querySelector("#daily .table-scroll-wrapper");
    if(wrapper) wrapper.parentNode.insertBefore(barTop, wrapper);
  }
  // Bottom bar — below the scroll wrapper
  if(!document.getElementById("dailyPagBar")){
    const barBot = document.createElement("div");
    barBot.id = "dailyPagBar";
    barBot.style.cssText = "display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:14px 0 4px;";
    const wrapper = document.querySelector("#daily .table-scroll-wrapper");
    if(wrapper) wrapper.parentNode.insertBefore(barBot, wrapper.nextSibling);
  }
}

function renderDailyPagination(currentPage, totalPages, totalRecords){
  buildDailyPagBars();

  const from = totalRecords === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const to   = Math.min(currentPage * PAGE_SIZE, totalRecords);

  const btnOn  = "padding:5px 11px;border-radius:7px;border:1px solid #334155;background:#1e293b;color:#94a3b8;font-size:12px;cursor:pointer;";
  const btnOff = "padding:5px 11px;border-radius:7px;border:1px solid #1e293b;background:#0f172a;color:#334155;font-size:12px;cursor:default;";

  let html = `<span style="font-size:12px;color:#64748b;margin-right:4px;">
    Showing <strong style="color:#93c5fd;">${from}–${to}</strong> of
    <strong style="color:#93c5fd;">${totalRecords}</strong>
  </span>`;

  html += `<button onclick="changeDailyPage(${currentPage-1})"
    ${currentPage===1?"disabled":""} style="${currentPage===1?btnOff:btnOn}">‹ Prev</button>`;

  const delta = 2;
  let prev = null;
  for(let p=1; p<=totalPages; p++){
    if(p===1 || p===totalPages || (p>=currentPage-delta && p<=currentPage+delta)){
      if(prev!==null && p-prev>1) html+=`<span style="color:#334155;padding:0 3px;">…</span>`;
      const active = p===currentPage;
      html += `<button onclick="changeDailyPage(${p})"
        style="min-width:32px;padding:5px 9px;border-radius:7px;font-size:12px;font-weight:${active?"700":"400"};
          border:1px solid ${active?"#3b82f6":"#334155"};
          background:${active?"#3b82f6":"#1e293b"};
          color:${active?"#fff":"#94a3b8"};cursor:pointer;">${p}</button>`;
      prev = p;
    }
  }

  html += `<button onclick="changeDailyPage(${currentPage+1})"
    ${currentPage===totalPages?"disabled":""} style="${currentPage===totalPages?btnOff:btnOn}">Next ›</button>`;

  const barTop = document.getElementById("dailyPagBarTop");
  const barBot = document.getElementById("dailyPagBar");
  if(barTop) barTop.innerHTML = html;
  if(barBot) barBot.innerHTML = html;
}

function changeDailyPage(page){
  const total = Math.max(1, Math.ceil(DB.daily.length / PAGE_SIZE));
  if(page < 1 || page > total) return;
  paginationState.daily = page;
  renderDaily();
  /* Scroll table back to top */
  const tc = document.querySelector("#daily .table-container");
  if(tc) tc.scrollTop = 0;
}

/* ── BOTTOM HORIZONTAL SCROLL SYNC ── */
function syncDailyScrollBar(){
  const wrapper = document.querySelector("#daily .table-scroll-wrapper");
  if(!wrapper) return;
  const tc    = wrapper.querySelector(".table-container");
  const tbl   = wrapper.querySelector("table");
  const topSc = wrapper.querySelector(".table-scroll-top");
  if(!tc || !tbl || !topSc) return;
  /* Set the inner div width to match actual table width */
  const inner = topSc.querySelector("div");
  if(inner) inner.style.width = tbl.scrollWidth + "px";
  /* Sync scroll positions */
  topSc.onscroll = () => { tc.scrollLeft = topSc.scrollLeft; };
  tc.onscroll    = () => { topSc.scrollLeft = tc.scrollLeft; };
}

/* ================= STAGE MOVEMENT (FINAL CLEAN ARCHITECTURE) ================= */


/* ── SAFE SUBMISSION INSERT: strips columns not in schema ── */
async function insertSubmission(payload){
  // Remove any fields that don't exist in the submission table
  const safe = {
    submission_date: payload.submission_date || payload.entry_date || "",
    name:            payload.name            || "",
    email:           payload.email           || "",
    phone:           payload.phone           || "",
    requirement:     payload.requirement     || "",
    client:          payload.client          || "",
    location:        payload.location        || "",
    visa:            payload.visa            || "",
    notes:           payload.notes           || "",
  };
  return await sb.from("submission").insert([safe]);
}

/* ✅ DAILY → SUBMISSION */
async function moveDailyToSubmission(id){

  console.log("Clicked ID:", id);

  const { data, error } = await sb
    .from("daily")
    .select("*")
    .eq("id", id)
    .limit(1);

  console.log("Fetched:", data, error);

  if(!data || data.length === 0){
    alert("Record not found");
    return;
  }

  const record = data[0];

  const payload = {
    submission_date: today(),
    name: record.name,
    email: record.email,
    phone: record.phone,
    requirement: record.requirement,
    client: record.client,
    location: record.location,
    visa: record.visa,
    notes: ""
  };

  const { error: insertError } =
    await sb.from("submission").insert([payload]);

  if(insertError){
    alert(insertError.message);
    return;
  }

  console.log("Inserted into submission");

  await fetchAllData();

  console.log("Submission DB:", DB.submission);

  renderStage("submission","submissionBody");
  renderKPI();
  switchSection("submission");
}


/* ✅ DAILY → PROPOSAL with modal for Program & PW Name */
async function moveDailyToProposal(id){
  const { data } = await sb.from("daily").select("*").eq("id", id).single();
  if(!data){ alert("Record not found"); return; }
  showProposalModal(data);
}

function showProposalModal(data){
  const existing = document.getElementById("proposalModal");
  if(existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "proposalModal";
  modal.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;";

  modal.innerHTML = `
    <div style="background:#1e293b;border:1px solid #1f2a3a;border-radius:14px;padding:30px;width:420px;box-shadow:0 20px 60px rgba(0,0,0,0.5);">
      <h3 style="margin-bottom:6px;color:#f1f5f9;font-size:16px;">Send to Proposal</h3>
      <p style="color:#94a3b8;font-size:13px;margin-bottom:20px;">Candidate: <strong style="color:#f1f5f9;">${data.name}</strong></p>

      <label style="display:block;font-size:12px;color:#94a3b8;margin-bottom:6px;">Program Name</label>
      <input id="modalProgram" placeholder="Enter Program Name"
        style="width:100%;padding:10px;background:#0f172a;border:1px solid #1f2a3a;color:#f1f5f9;border-radius:8px;font-size:13px;margin-bottom:14px;">

      <label style="display:block;font-size:12px;color:#94a3b8;margin-bottom:6px;">PW Name</label>
      <input id="modalPWName" placeholder="Enter PW Name"
        style="width:100%;padding:10px;background:#0f172a;border:1px solid #1f2a3a;color:#f1f5f9;border-radius:8px;font-size:13px;margin-bottom:20px;">

      <div style="display:flex;gap:10px;justify-content:flex-end;">
        <button onclick="closeProposalModal()"
          style="background:#334155;padding:8px 18px;border-radius:8px;border:none;color:#f1f5f9;cursor:pointer;font-size:13px;">
          Cancel
        </button>
        <button onclick="submitProposal('${data.id}')"
          style="background:#3b82f6;padding:8px 18px;border-radius:8px;border:none;color:white;cursor:pointer;font-size:13px;font-weight:600;">
          Save Proposal
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  document.getElementById("modalProgram").focus();
}

function closeProposalModal(){
  const modal = document.getElementById("proposalModal");
  if(modal) modal.remove();
}

async function submitProposal(dailyId){
  const programName = document.getElementById("modalProgram").value.trim();
  const pwName      = document.getElementById("modalPWName").value.trim();

  if(!programName || !pwName){
    alert("Please enter both Program Name and PW Name");
    return;
  }

  const { data } = await sb.from("daily").select("*").eq("id", dailyId).single();
  if(!data){ alert("Record not found"); return; }

  const payload = {
    proposal_date: today(),
    name:         data.name,
    email:        data.email,
    phone:        data.phone,
    requirement:  data.requirement,
    client:       data.client,
    location:     data.location,
    visa:         data.visa,
    notes:        "",
    program_name: programName,
    pw_name:      pwName
  };

  const { error } = await sb.from("proposal").insert([payload]);
  if(error){ alert(error.message); return; }

  closeProposalModal();
  await fetchAllData();
  renderStage("proposal","proposalBody");
  renderKPI();
  switchSection("proposal");
}

window.submitProposal     = submitProposal;
window.closeProposalModal = closeProposalModal;
window.showProposalModal  = showProposalModal;


/* ✅ SUBMISSION → INTERVIEW */
async function moveToInterviewById(id){

  console.log("Move to Interview:", id);

  const { data, error } = await sb
    .from("submission")
    .select("*")
    .eq("id", id)
    .limit(1);

  if(!data || data.length === 0){
    alert("Record not found");
    return;
  }

  const record = data[0];

  const payload = {
    interview_scheduled_on: today(),
    name: record.name,
    email: record.email,
    phone: record.phone,
    requirement: record.requirement,
    client: record.client,
    location: record.location,
    visa: record.visa,
    notes: ""
  };

  const { error: insertError } =
    await sb.from("interview").insert([payload]);

  if(insertError){
    alert(insertError.message);
    return;
  }

  console.log("Inserted into interview");

  await fetchAllData();

  renderStage("interview","interviewBody");
  renderKPI();
  switchSection("interview");
}


/* ✅ INTERVIEW → PLACEMENT */
async function moveToPlacementById(id){

  const { data } = await sb
    .from("interview")
    .select("*")
    .eq("id", id)
    .limit(1);

  if(!data || data.length === 0){
    alert("Record not found");
    return;
  }

  const record = data[0];

  const payload = {
    placement_date: today(),
    name: record.name,
    email: record.email,
    phone: record.phone,
    requirement: record.requirement,
    client: record.client,
    location: record.location,
    visa: record.visa,
    notes: ""
  };

  await sb.from("placement").insert([payload]);

  await fetchAllData();
  renderStage("placement","placementBody");
  renderKPI();
  switchSection("placement");
}


/* ✅ PLACEMENT → START */
async function moveToStartById(id){

  const { data } = await sb
    .from("placement")
    .select("*")
    .eq("id", id)
    .limit(1);

  if(!data || data.length === 0){
    alert("Record not found");
    return;
  }

  const record = data[0];

  const payload = {
    start_date: today(),
    name: record.name,
    email: record.email,
    phone: record.phone,
    requirement: record.requirement,
    client: record.client,
    location: record.location,
    visa: record.visa,
    notes: ""
  };

  await sb.from("start").insert([payload]);

  await fetchAllData();
  renderStage("start","startBody");
  renderKPI();
  switchSection("start");
}
 

/* ================= STAGE RENDER ================= */

function renderStage(stage, bodyId){
  const body = document.getElementById(bodyId);
  if(!body) return;

  const dateField =
    stage === "submission"  ? "submission_date" :
    stage === "proposal"    ? "proposal_date" :
    stage === "interview"   ? "interview_scheduled_on" :
    stage === "placement"   ? "placement_date" :
    stage === "start"       ? "start_date" : "";

  const sorted = [...DB[stage]].sort((a,b)=>
    new Date(b[dateField]||0) - new Date(a[dateField]||0)
  );

  const totalRecords = sorted.length;
  const totalPages   = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const rawPage      = paginationState[stage] || 1;
  const currentPage  = Math.min(rawPage, totalPages);
  paginationState[stage] = currentPage;

  const pageData = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  body.innerHTML = "";
  const _frag = document.createDocumentFragment();
  const _tmp  = document.createElement("tbody");
  const globalOffset = (currentPage - 1) * PAGE_SIZE;

  pageData.forEach((r, index) => {
    const absIndex = globalOffset + index;

    let actionButtons = "";
    if(stage==="submission"){
      actionButtons = `<button onclick="moveToInterviewById('${r.id}')">Interview</button>`;
    }
    if(stage==="interview"){
      actionButtons = `<button onclick="moveToPlacementById('${r.id}')">Placement</button>`;
    }
    if(stage==="placement"){
      actionButtons = `<button onclick="moveToStartById('${r.id}')">Start</button>`;
    }

    let row = `
<tr>
<td>${absIndex + 1}</td>
<td>
  <input type="date"
    value="${r.submission_date || r.proposal_date || r.interview_scheduled_on || r.placement_date || r.start_date || ""}"
    style="background:#0f172a;border:1px solid #1f2a3a;color:#f1f5f9;border-radius:6px;padding:4px 6px;font-size:12px;width:130px;"
    onchange="updateDate('${stage}','${r.id}',this.value)">
</td>
<td>${r.name||""}</td>
<td>${r.email||""}</td>
<td>${r.phone||""}</td>
<td>${r.requirement||""}</td>
<td>${r.client||""}</td>
`;

    if(stage === "proposal"){
      row += `<td>${r.program_name||""}</td><td>${r.pw_name||""}</td>`;
    }

    row += `
<td>${r.location||""}</td>
<td>${r.visa||""}</td>
${stage==="interview" ? `
<td>
  <select style="background:#0f172a;border:1px solid #1f2a3a;color:#f1f5f9;border-radius:6px;padding:4px 6px;font-size:12px;width:100px;"
    onchange="updateFieldById('interview','${r.id}','interview_round',this.value)">
    <option value="">-- Round --</option>
    <option value="1st Round" ${r.interview_round==="1st Round"?"selected":""}>1st Round</option>
    <option value="2nd Round" ${r.interview_round==="2nd Round"?"selected":""}>2nd Round</option>
    <option value="3rd Round" ${r.interview_round==="3rd Round"?"selected":""}>3rd Round</option>
  </select>
</td>
<td>
  <select style="background:#0f172a;border:1px solid #1f2a3a;color:${r.interview_status==="Accepted"?"#10b981":r.interview_status==="Declined"?"#ef4444":"#f59e0b"};border-radius:6px;padding:4px 6px;font-size:12px;width:110px;"
    onchange="updateFieldById('interview','${r.id}','interview_status',this.value);this.style.color=this.value==='Accepted'?'#10b981':this.value==='Declined'?'#ef4444':'#f59e0b';">
    <option value="">-- Status --</option>
    <option value="Accepted" ${r.interview_status==="Accepted"?"selected":""}>✅ Accepted</option>
    <option value="Declined" ${r.interview_status==="Declined"?"selected":""}>❌ Declined</option>
    <option value="Pending"  ${r.interview_status==="Pending" ?"selected":""}>⏳ Pending</option>
  </select>
</td>
<td>
  <input value="${(r.status_notes||"").replace(/"/g,"&quot;")}"
    placeholder="Status notes..."
    style="background:#0f172a;border:1px solid #1f2a3a;color:#f1f5f9;border-radius:6px;padding:4px 8px;font-size:12px;width:150px;"
    onchange="updateFieldById('interview','${r.id}','status_notes',this.value)">
</td>` : ""}
${stage==="placement" ? `
<td>
  <select style="background:#0f172a;border:1px solid #1f2a3a;color:${r.offer_status==="Accepted"?"#10b981":r.offer_status==="Rejected"?"#ef4444":"#f59e0b"};border-radius:6px;padding:4px 6px;font-size:12px;width:130px;"
    onchange="updateFieldById('placement','${r.id}','offer_status',this.value);this.style.color=this.value==='Accepted'?'#10b981':this.value==='Rejected'?'#ef4444':'#f59e0b';">
    <option value="">-- Offer --</option>
    <option value="Accepted" ${r.offer_status==="Accepted"?"selected":""}>✅ Accepted</option>
    <option value="Rejected" ${r.offer_status==="Rejected"?"selected":""}>❌ Rejected</option>
    <option value="Pending"  ${r.offer_status==="Pending" ?"selected":""}>⏳ Pending</option>
  </select>
</td>` : ""}
<td>
  <input value="${(r.notes||"").replace(/"/g,"&quot;")}"
    placeholder="Add notes..."
    style="background:#0f172a;border:1px solid #1f2a3a;color:#f1f5f9;border-radius:6px;padding:4px 8px;font-size:12px;width:160px;"
    onchange="updateNoteById('${stage}','${r.id}',this.value)">
</td>
<td>
${actionButtons}
<button onclick="deleteRowById('${stage}','${r.id}')">Del</button>
</td>
</tr>`;

    _tmp.innerHTML = row;
    const _tr = _tmp.firstElementChild;
    if(_tr) _frag.appendChild(_tr);
  });
  body.appendChild(_frag);

  // Pagination bar
  renderStagePagination(stage, currentPage, totalPages, totalRecords);

  // Horizontal scroll sync
  syncStageScrollBar(stage);
}

/* ── Unified pagination bar for all stages — top + bottom ── */
function renderStagePagination(stage, currentPage, totalPages, totalRecords){
  // Ensure top bar exists (above scroll wrapper)
  const wrapperId = stage + "ScrollWrapper";
  const wrapper   = document.getElementById(wrapperId);
  if(wrapper && !document.getElementById(stage + "PagBarTop")){
    const barTop = document.createElement("div");
    barTop.id    = stage + "PagBarTop";
    barTop.style.cssText = "display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:0 0 12px;";
    wrapper.parentNode.insertBefore(barTop, wrapper);
  }

  const from = totalRecords === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const to   = Math.min(currentPage * PAGE_SIZE, totalRecords);

  const btnOn  = "padding:5px 11px;border-radius:7px;font-size:12px;border:1px solid #334155;background:#1e293b;color:#94a3b8;cursor:pointer;";
  const btnOff = "padding:5px 11px;border-radius:7px;font-size:12px;border:1px solid #1e293b;background:#0f172a;color:#334155;cursor:default;";

  let html = `<span style="font-size:12px;color:#64748b;margin-right:4px;">
    Showing <strong style="color:#93c5fd;">${from}–${to}</strong> of
    <strong style="color:#93c5fd;">${totalRecords}</strong>
  </span>`;

  html += `<button onclick="changeStage('${stage}',${currentPage-1})"
    ${currentPage===1?"disabled":""} style="${currentPage===1?btnOff:btnOn}">‹ Prev</button>`;

  const delta = 2;
  let prev = null;
  for(let p=1; p<=totalPages; p++){
    if(p===1 || p===totalPages || (p>=currentPage-delta && p<=currentPage+delta)){
      if(prev!==null && p-prev>1) html+=`<span style="color:#334155;padding:0 3px;">…</span>`;
      const active = p===currentPage;
      html += `<button onclick="changeStage('${stage}',${p})"
        style="min-width:32px;padding:5px 9px;border-radius:7px;font-size:12px;font-weight:${active?"700":"400"};
          border:1px solid ${active?"#3b82f6":"#334155"};
          background:${active?"#3b82f6":"#1e293b"};
          color:${active?"#fff":"#94a3b8"};cursor:pointer;">${p}</button>`;
      prev = p;
    }
  }

  html += `<button onclick="changeStage('${stage}',${currentPage+1})"
    ${currentPage===totalPages?"disabled":""} style="${currentPage===totalPages?btnOff:btnOn}">Next ›</button>`;

  const barTop = document.getElementById(stage + "PagBarTop");
  const barBot = document.getElementById(stage + "PagBar");
  if(barTop) barTop.innerHTML = html;
  if(barBot) barBot.innerHTML = html;
}

function changeStage(stage, page){
  const total = Math.max(1, Math.ceil(DB[stage].length / PAGE_SIZE));
  if(page < 1 || page > total) return;
  paginationState[stage] = page;
  renderStage(stage, stage + "Body");
  // Scroll section back to top
  const tc = document.querySelector(`#${stage} .table-container`);
  if(tc) tc.scrollTop = 0;
}

/* ── Horizontal scroll sync for all stages ── */
function syncStageScrollBar(stage){
  const wrapper = document.getElementById(stage + "ScrollWrapper");
  if(!wrapper) return;
  const tc    = wrapper.querySelector(".table-container");
  const tbl   = wrapper.querySelector("table");
  const topSc = wrapper.querySelector(".table-scroll-top");
  if(!tc || !tbl || !topSc) return;
  const inner = topSc.querySelector("div");
  // Update width on every render
  if(inner) inner.style.width = tbl.scrollWidth + "px";
  // Attach listeners only once
  if(!tc._scrollSynced){
    tc._scrollSynced = true;
    topSc.onscroll = () => { tc.scrollLeft = topSc.scrollLeft; };
    tc.onscroll    = () => { topSc.scrollLeft = tc.scrollLeft; };
  }
}


/* ================= KPI ================= */

/* ── Year selector state ── */
let kpiYear = new Date().getFullYear();

function buildYearSelector(){
  const existing = document.getElementById("kpiYearSelector");
  if(existing) return; // already built

  const currentYear = new Date().getFullYear();
  const years = [];
  for(let y = 2023; y <= currentYear + 2; y++) years.push(y);

  const wrapper = document.createElement("div");
  wrapper.id = "kpiYearSelector";
  wrapper.style.cssText = "display:flex;align-items:center;gap:10px;margin-bottom:18px;flex-wrap:wrap;";

  const label = document.createElement("span");
  label.style.cssText = "font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#64748b;";
  label.textContent = "YEAR";
  wrapper.appendChild(label);

  years.forEach(y => {
    const btn = document.createElement("button");
    btn.textContent = y;
    btn.id = "kpiYearBtn_" + y;
    btn.style.cssText = `padding:5px 14px;border-radius:8px;font-size:13px;font-weight:600;border:1px solid;transition:all 0.15s;`;
    applyYearBtnStyle(btn, y === kpiYear);
    btn.onclick = () => {
      kpiYear = y;
      document.querySelectorAll("[id^='kpiYearBtn_']").forEach(b => {
        applyYearBtnStyle(b, b.id === "kpiYearBtn_" + y);
      });
      renderKPI();
    };
    wrapper.appendChild(btn);
  });

  // Insert before the KPI table
  const dashSection = document.getElementById("dashboard");
  if(dashSection){
    const tableContainer = dashSection.querySelector(".table-container");
    if(tableContainer) dashSection.insertBefore(wrapper, tableContainer);
  }
}

function applyYearBtnStyle(btn, active){
  if(active){
    btn.style.background = "rgba(59,130,246,0.2)";
    btn.style.color = "#93c5fd";
    btn.style.borderColor = "rgba(59,130,246,0.5)";
  } else {
    btn.style.background = "rgba(255,255,255,0.03)";
    btn.style.color = "#64748b";
    btn.style.borderColor = "rgba(255,255,255,0.06)";
  }
}

function renderKPI(){
  if(!kpiSub) return;

  buildYearSelector();

  const yr = kpiYear;

  // Filter each dataset to selected year
  const subY   = DB.submission.filter(r => r.submission_date        && new Date(r.submission_date).getFullYear()        === yr);
  const intY   = DB.interview.filter(r  => r.interview_scheduled_on && new Date(r.interview_scheduled_on).getFullYear() === yr && (!r.interview_round || r.interview_round === "1st Round"));
  const placeY = DB.placement.filter(r  => r.placement_date         && new Date(r.placement_date).getFullYear()         === yr);
  const startY = DB.start.filter(r      => r.start_date             && new Date(r.start_date).getFullYear()             === yr);

  kpiSub.innerText   = subY.length;
  kpiInt.innerText   = intY.length;
  kpiPlace.innerText = placeY.length;
  kpiStart.innerText = startY.length;

  if(!monthlyBody) return;

  // Use DocumentFragment for fast DOM insertion
  const frag = document.createDocumentFragment();
  for(let m = 0; m < 12; m++){
    const sub   = countMonthArr(subY,   "submission_date",        m);
    const intC  = countMonthArr(intY,   "interview_scheduled_on", m);
    const place = countMonthArr(placeY, "placement_date",         m);
    const start = countMonthArr(startY, "start_date",             m);
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${MONTHS[m]}</td><td>${sub}</td><td>${intC}</td><td>${place}</td><td>${start}</td>`;
    frag.appendChild(tr);
  }
  monthlyBody.innerHTML = "";
  monthlyBody.appendChild(frag);
}

function countMonth(arr,field,month){
  return arr.filter(r=>{ if(!r[field]) return false; return new Date(r[field]).getMonth()===month; }).length;
}

function countMonthArr(arr,field,month){
  return arr.filter(r=>{ if(!r[field]) return false; return new Date(r[field]).getMonth()===month; }).length;
}

/* ================= TASK SYSTEM ================= */

function addTask(){
  if(!taskTitle.value || !taskDue.value) return;

  DB.tasks.unshift({
    
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

async function fetchAllData(){
  try{
    // ── Fetch all tables in parallel — each handles its own error ──
    const safeSelect = async (table, cols="*") => {
      try {
        const { data, error } = await sb.from(table).select(cols);
        if(error){ console.warn(`[${table}] fetch warning:`, error.message); return []; }
        return data || [];
      } catch(e) {
        console.warn(`[${table}] fetch failed:`, e.message);
        return [];
      }
    };

    const [jd, daily, submission, proposal, interview, placement, start, tasks, meetings] = await Promise.all([
      safeSelect("jd"),
      safeSelect("daily"),
      safeSelect("submission"),
      safeSelect("proposal"),
      safeSelect("interview"),
      safeSelect("placement"),
      safeSelect("start"),
      safeSelect("tasks"),
      safeSelect("meetings"),
    ]);

    DB.jd         = jd;
    DB.daily      = daily;
    DB.submission = submission;
    DB.proposal   = proposal;
    DB.interview  = interview;
    DB.placement  = placement;
    DB.start      = start;
    DB.tasks      = tasks;
    DB.meetings   = meetings;

    console.log("All data loaded successfully", DB);
  }catch(err){
    console.error("Database error:", err);
  }
}


async function loadDashboard(){

  await fetchAllData();

  renderJD();
  populateRequirementDropdown(); 

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

async function migrateLocalToSupabase(){

  const localData = JSON.parse(localStorage.getItem("ATS_DB"));

  if(!localData){
    alert("No local data found.");
    return;
  }

  console.log("Starting migration...");

  await sb.from("jd").insert(localData.jd || []);
  await sb.from("daily").insert(localData.daily || []);
  await sb.from("submission").insert(localData.submission || []);
  await sb.from("proposal").insert(localData.proposal || []);
  await sb.from("interview").insert(localData.interview || []);
  await sb.from("placement").insert(localData.placement || []);
  await sb.from("start").insert(localData.start || []);
  await sb.from("tasks").insert(localData.tasks || []);
  await sb.from("meetings").insert(localData.meetings || []);

  alert("Migration completed!");
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

  try{

    const { data } = await sb.auth.getSession();

    if(data.session){

      const app = document.getElementById("app");
      if(app) app.style.display = "block";

      await loadDashboard();

    } else {

      console.log("No active session");
      const app = document.getElementById("app");
      if(app) app.style.display = "block";

      await loadDashboard();  // allow dashboard load anyway

    }

  } catch(e){

    console.log("Session error:", e);

  }
}

/* ================= PAGE LOAD ================= */

document.addEventListener("DOMContentLoaded", async function(){

  initTabs();

  const app = document.getElementById("app");
  if(app) app.style.display = "block";

  await loadDashboard();

  /* ── EXTENSION HANDOFF: read candidate data from URL hash ── */
  try {
    const hash = window.location.hash;
    if (hash && hash.startsWith("#candidate=")) {
      const encoded = hash.replace("#candidate=", "");
      const data = JSON.parse(decodeURIComponent(encoded));
      window.history.replaceState(null, "", window.location.pathname);

      /* ── CLEAN BAD NAMES FROM CEIPAL UI ARTIFACTS ── */
      const CEIPAL_JUNK_NAMES = [
        "switch account","profile migrated","sign out","log out",
        "logout","sign in","login","candidate","applicant",
        "full name","name","user","unknown","n/a","na",
        "ceipal","ats","save to daily","parse page"
      ];
      function cleanCeipalName(raw) {
        if (!raw || !raw.trim()) return "";
        const lower = raw.trim().toLowerCase();
        /* Reject known Ceipal UI labels */
        if (CEIPAL_JUNK_NAMES.some(j => lower === j || lower.includes(j))) return "";
        /* Reject if contains digits (not a real name) */
        if (/\d/.test(raw)) return "";
        /* Reject single-word strings that look like UI labels */
        const words = raw.trim().split(/\s+/);
        if (words.length === 1 && raw.length > 20) return "";
        return raw.trim();
      }
      const cleanedName = cleanCeipalName(data.name);

      switchSection("resume");
      const resumeEl = document.getElementById("resumeText");
      if (resumeEl) resumeEl.value = data.resume_text || "";
      const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ""; };
      set("resumeName",     cleanedName);
      set("resumeEmail",    data.email);
      set("resumePhone",    data.phone);
      set("resumeLocation", data.location);
      set("dailyName",      cleanedName);
      set("dailyEmail",     data.email);
      set("dailyPhone",     data.phone);
      set("dailyLocation",  data.location);
      const dateEl = document.getElementById("dailyDate");
      if (dateEl && !dateEl.value) dateEl.value = today();
      if (data.visa) {
        ["resumeVisa","dailyVisa"].forEach(id => {
          const sel = document.getElementById(id);
          if (!sel) return;
          const opt = Array.from(sel.options).find(o => o.value.toLowerCase() === data.visa.toLowerCase());
          if (opt) sel.value = opt.value;
        });
      }
      if (data.source) {
        const sel = document.getElementById("dailySource");
        if (sel) {
          const opt = Array.from(sel.options).find(o => o.value.toLowerCase() === data.source.toLowerCase());
          if (opt) sel.value = opt.value;
        }
      }
      if (!document.getElementById("extGoToDailyBtn")) {
        const btn = document.createElement("button");
        btn.id = "extGoToDailyBtn";
        btn.textContent = "✅ Done — Fill Daily Entry Form";
        btn.style.cssText = "margin-top:16px;background:#3b82f6;color:#fff;padding:10px 24px;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;display:inline-block;";
        btn.addEventListener("click", () => {
          /* Switch to Daily tab */
          switchSection("daily");

          /* Pre-fill the manual entry form from parsed resume data */
          const setVal = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
          const parsedName = document.getElementById("resumeName")?.value || "";
          setVal("dailyName",     parsedName);
          setVal("dailyEmail",    document.getElementById("resumeEmail")?.value);
          setVal("dailyPhone",    document.getElementById("resumePhone")?.value);
          setVal("dailyLocation", document.getElementById("resumeLocation")?.value);
          /* If name is empty, focus the name field so user types it */
          if (!parsedName) {
            setTimeout(() => {
              const nf = document.getElementById("dailyName");
              if (nf) { nf.focus(); nf.placeholder = "⚠️ Enter candidate name manually"; }
            }, 400);
          }

          /* Set today's date if not already filled */
          const dateEl = document.getElementById("dailyDate");
          if (dateEl && !dateEl.value) dateEl.value = today();

          /* Copy visa status */
          const rvEl = document.getElementById("resumeVisa");
          const dvEl = document.getElementById("dailyVisa");
          if (rvEl && dvEl && rvEl.value) {
            const opt = Array.from(dvEl.options).find(o => o.value === rvEl.value);
            if (opt) dvEl.value = opt.value;
          }

          /* Store resume text so AI scoring works after save */
          const resumeEl2 = document.getElementById("resumeText");
          if (resumeEl2) window._parsedResumeText = resumeEl2.value;

          /* Scroll entry form into view */
          const entryPanel = document.querySelector("#daily .entry-panel");
          if (entryPanel) entryPanel.scrollIntoView({ behavior: "smooth", block: "start" });

          /* Show a blue info hint banner for 8 seconds */
          if (!document.getElementById("dailyFormHint")) {
            const h = document.createElement("div");
            h.id = "dailyFormHint";
            h.style.cssText = "background:rgba(59,130,246,0.12);border:1px solid rgba(59,130,246,0.3);border-radius:8px;padding:10px 14px;margin-bottom:12px;color:#93c5fd;font-size:13px;";
            const nameVal2 = document.getElementById("dailyName")?.value || "";
            const nameWarn = nameVal2 ? "" : ' <span style="color:#f87171;font-weight:600;">⚠️ Name not detected — type it manually.</span>';
            h.innerHTML = "ℹ️ Resume data pre-filled." + nameWarn + " Select <strong>Requirement</strong>, then click <strong>Save Candidate</strong>.";
            const ep = document.querySelector("#daily .entry-panel");
            if (ep) ep.insertBefore(h, ep.firstChild);
            setTimeout(() => { if (h.parentNode) h.parentNode.removeChild(h); }, 8000);
          }
        });
        const sec = document.getElementById("resume");
        if (sec) sec.appendChild(btn);
      }
      if (resumeEl) resumeEl.scrollIntoView({ behavior:"smooth", block:"start" });
    }
  } catch(e) {
    console.log("Extension handoff error:", e.message);
  }

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

// changePage replaced by changeStage

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

function enableTopScrollSync() {

  document.querySelectorAll(".table-scroll-wrapper")
    .forEach(wrapper => {

      const topScroll =
        wrapper.querySelector(".table-scroll-top");

      const tableContainer =
        wrapper.querySelector(".table-container");

      const table =
        wrapper.querySelector("table");

      if(!topScroll || !tableContainer || !table)
        return;

      topScroll.firstElementChild.style.width =
        table.scrollWidth + "px";

      topScroll.addEventListener("scroll", () => {
        tableContainer.scrollLeft =
          topScroll.scrollLeft;
      });

      tableContainer.addEventListener("scroll", () => {
        topScroll.scrollLeft =
          tableContainer.scrollLeft;
      });

  });
}

function viewJD(index){

  const jd = DB.jd[index];

  if(!jd || !jd.jd_text){
    alert("JD not available for this record.");
    return;
  }

  const win = window.open("", "JD Viewer", "width=900,height=700");

  win.document.write(`
  <html>
  <head>
  <title>Job Description</title>

  <style>
  body{
    font-family:Arial;
    padding:20px;
    line-height:1.6;
  }

  textarea{
    width:100%;
    height:85vh;
    font-size:14px;
  }

  button{
    padding:8px 12px;
    margin-bottom:10px;
  }
  </style>

  </head>

  <body>

  <h2>${jd.title}</h2>

  <button onclick="copyJD()">Copy JD</button>

  <textarea id="jdContent">${jd.jd_text}</textarea>

  <script>
  function copyJD(){
    const text = document.getElementById("jdContent");
    text.select();
    document.execCommand("copy");
    alert("JD copied!");
  }
  </script>

  </body>
  </html>
  `);
}

async function deleteRow(stage,index){

  if(!confirm("Delete this record?")) return;

  const record = DB[stage][index];
  if(!record || !record.id) return;

  const { error } = await sb.from(stage).delete().eq("id", record.id);

  if(error){
    alert("Delete failed: " + error.message);
    return;
  }

  await fetchAllData();

  renderDaily();
  renderStage("submission","submissionBody");
  renderStage("proposal","proposalBody");
  renderStage("interview","interviewBody");
  renderStage("placement","placementBody");
  renderStage("start","startBody");

  renderKPI();
}
async function deleteRowById(stage, id){
  if(!confirm("Delete this record?")) return;

  if(!id || id === "undefined" || id === "null"){
    alert("Cannot delete: record has no valid ID. Please refresh and try again.");
    return;
  }

  const { data, error, status } = await sb.from(stage).delete().eq("id", id).select();

  if(error){
    alert("Delete failed (" + status + "): " + error.message + "\n\nIf 403/RLS error: enable DELETE policy in Supabase for table: " + stage);
    return;
  }

  if(!data || data.length === 0){
    alert("Nothing was deleted.\n\nLikely cause: Supabase Row Level Security (RLS) is blocking DELETE.\nFix: In Supabase → Table Editor → " + stage + " → RLS Policies → Add policy: allow DELETE for anon role.");
    return;
  }

  await fetchAllData();

  renderDaily();
  renderStage("submission","submissionBody");
  renderStage("proposal","proposalBody");
  renderStage("interview","interviewBody");
  renderStage("placement","placementBody");
  renderStage("start","startBody");
  renderKPI();
}
async function viewResume(index){

  const record = DB.daily[index];

  if(!record.resume_text){
    alert("Resume not available");
    return;
  }

  /* Find JD linked to this candidate requirement */
  const jd = DB.jd.find(j => j.title === record.requirement);

  const jdText = jd ? jd.jd_text : "";

  /* Run matching analysis */

  const result = analyzeMatch(record.resume_text, jdText);
  
  record.ai_score = result.score;

  record.ai_notes =
`Missing Skills: ${result.missing}
 Questions: ${result.questions}`;

await sb
.from("daily")
.update({
  ai_score: record.ai_score,
  ai_notes: record.ai_notes
})
.eq("id", record.id);

  const win = window.open("", "Resume Viewer", "width=900,height=750");

  win.document.write(`
  <html>
  <head>

  <title>Resume Viewer</title>

  <style>
  body{
    font-family:Arial;
    padding:20px;
  }

  textarea{
    width:100%;
    height:60vh;
    font-size:14px;
    line-height:1.5;
  }

  .box{
    margin-bottom:15px;
    padding:10px;
    background:#f5f5f5;
  }

  .score{
    font-size:18px;
    font-weight:bold;
  }

  </style>

  </head>

  <body>

  <h2>${record.name}</h2>

  <div class="box score">
  AI Score: ${result.score} / 100
  </div>

  <div class="box">
  <b>Missing Skills</b><br>
  ${result.missing || "None"}
  </div>

  <div class="box">
  <b>Questions to Ask Candidate</b><br>
  ${result.questions || "None"}
  </div>

  <h3>Full Resume</h3>

  <textarea>${record.resume_text}</textarea>

  </body>
  </html>
  `);
}


/* =====================================================
   BASIC AI MATCH ENGINE (Temporary until ChatGPT API)
===================================================== */

/* ══════════════════════════════════════════
   AI SCORE — Claude API candidate matcher
══════════════════════════════════════════ */
async function scoreCandidate(id){
  const record = DB.daily.find(r => r.id === id);
  if(!record){ alert("Record not found."); return; }

  // Find the JD linked to this requirement
  const jd = DB.jd.find(j => j.title === record.requirement);

  if(!record.resume_text && !jd){
    alert("No resume text and no Job Description found for this candidate.\n\nPlease:\n1. Add a JD in Job Requirements tab\n2. Make sure the requirement name matches");
    return;
  }

  // Update button to loading state
  const btn = document.getElementById("score_" + id);
  if(btn){ btn.innerHTML = "⏳ Scoring..."; btn.disabled = true; }

  try {
    const resumeSection = record.resume_text
      ? `CANDIDATE RESUME:
${record.resume_text.substring(0, 3000)}`
      : `CANDIDATE INFO:
Name: ${record.name}
Requirement Applied: ${record.requirement}
Location: ${record.location}
Visa: ${record.visa}`;

    const jdSection = jd?.jd_text
      ? `JOB DESCRIPTION:
${jd.jd_text.substring(0, 2000)}`
      : `JOB TITLE: ${record.requirement}
CLIENT: ${record.client}`;

    const prompt = `You are a technical recruiting expert. Analyze how well this candidate matches the job requirement.

${jdSection}

${resumeSection}

Respond ONLY with a valid JSON object in this exact format (no markdown, no explanation):
{
  "score": <number 0-100>,
  "summary": "<2 sentence match summary>",
  "strengths": "<key matching skills/experience, comma separated>",
  "gaps": "<missing skills or concerns, comma separated>",
  "recommendation": "<Strong Match | Good Match | Partial Match | Weak Match>"
}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();
    const rawText = data.content?.[0]?.text || "";

    // Parse JSON from response
    let result;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      result = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
    } catch(e) {
      throw new Error("Could not parse AI response: " + rawText.substring(0, 100));
    }

    const score = Math.min(100, Math.max(0, parseInt(result.score) || 0));
    const notes = `${result.recommendation} (${score}%)\nStrengths: ${result.strengths}\nGaps: ${result.gaps}\n${result.summary}`;

    // Save to Supabase
    await sb.from("daily").update({ ai_score: score, ai_notes: notes }).eq("id", id);

    // Update local DB
    record.ai_score = score;
    record.ai_notes = notes;

    // Re-render just this row's score cell
    const scoreCell = document.getElementById("score_" + id);
    if(scoreCell){
      const color = score>=80 ? "#10b981" : score>=60 ? "#f59e0b" : "#ef4444";
      const bg    = score>=80 ? "rgba(16,185,129,0.15)" : score>=60 ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)";
      const bdr   = score>=80 ? "rgba(16,185,129,0.3)"  : score>=60 ? "rgba(245,158,11,0.3)"  : "rgba(239,68,68,0.3)";
      scoreCell.outerHTML = `<span id="score_${id}" style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:13px;font-weight:700;
        background:${bg};color:${color};border:1px solid ${bdr};">${score}%</span>`;
    }
    // Update notes cell
    const row = document.getElementById("score_" + id)?.closest("tr");
    if(row){
      const notesCell = row.querySelectorAll("td")[12];
      if(notesCell) notesCell.innerText = notes;
    }

  } catch(err) {
    console.error("AI Score error:", err);
    if(btn){ btn.innerHTML = "✦ Score"; btn.disabled = false; }
    alert("AI scoring failed: " + err.message);
  }
}

// Keep analyzeMatch as fallback (used by viewResume)
function analyzeMatch(resumeText, jdText){
  if(!resumeText || !jdText) return { score: 0, missing: "Resume or JD not available", questions: "" };
  const resume = resumeText.toLowerCase();
  const jd = jdText.toLowerCase();
  const skills = ["python","java","docker","kubernetes","aws","linux","terraform","jenkins","ci/cd","selenium","react","angular","node","sql","mongodb","c++","c#","azure","gcp","oracle","sap","salesforce","tableau","power bi"];
  let match = 0, missing = [];
  skills.forEach(s => { if(jd.includes(s)){ if(resume.includes(s)) match++; else missing.push(s); } });
  const score = Math.min(100, match * 12);
  return { score, missing: missing.join(", "), questions: missing.map(s=>`Experience with ${s}?`).join("<br>") };
}


/* ================= RECURRING TASK SYSTEM ================= */

function addRecurringTask(){

const title = document.getElementById("recTitle").value;
const date = document.getElementById("recDate").value;
const repeat = document.getElementById("recRepeat").value;
const reminder = document.getElementById("recReminder").value;

if(!title || !date){
  alert("Enter task and date");
  return;
}

const tasks = JSON.parse(localStorage.getItem("recTasks") || "[]");

tasks.push({
  title,
  date,
  repeat,
  reminder
});

localStorage.setItem("recTasks", JSON.stringify(tasks));

renderRecurringTasks();

document.getElementById("recTitle").value="";
document.getElementById("recDate").value="";
}

/* ================= SHOW TASKS ================= */

function renderRecurringTasks(){

const tasks = JSON.parse(localStorage.getItem("recTasks") || "[]");

const list = document.getElementById("recurringList");

if(!list) return;

list.innerHTML = "";

const today = new Date();

tasks.forEach(t=>{

const taskDate = new Date(t.date);

const diffDays = Math.ceil((taskDate - today)/(1000*60*60*24));

if(diffDays < 0) return;

let reminderText = "";

if(diffDays == parseInt(t.reminder)){
  reminderText = "⚠ Reminder coming soon";
}

if(diffDays == 1){
  reminderText = "⚠ Tomorrow";
}

if(diffDays == 0){
  reminderText = "⚠ Today";
}

list.innerHTML += `
<div style="margin-bottom:10px;padding:10px;background:#1e293b;border-radius:6px">
<b>${t.title}</b><br>
Next Date: ${t.date} (${t.repeat})<br>
<span style="color:orange">${reminderText}</span>
</div>
`;

});

}

/* run when productivity tab opens */

document.addEventListener("click", function(e){

  if(e.target && e.target.dataset && e.target.dataset.tab === "productivity"){
    setTimeout(renderRecurringTasks,200);
  }

});


// ✅ MAKE FUNCTIONS GLOBAL (IMPORTANT)

window.moveDailyToSubmission = moveDailyToSubmission;
window.moveDailyToProposal = moveDailyToProposal;

window.moveToInterviewById = moveToInterviewById;

window.moveToPlacementById = moveToPlacementById;
window.moveToStartById = moveToStartById;

window.deleteRowById = deleteRowById;
window.updateNote = updateNote;
window.updateDate = updateDate;
window.updateNoteById = updateNoteById;
window.deleteRow = deleteRow;
window.changeDailyPage = changeDailyPage;
window.renderDailyPagination = renderDailyPagination;
window.viewResume = viewResume;
window.editJD = editJD;
window.saveJDRow = saveJDRow;
window.deleteJD = deleteJD;
window.viewJD = viewJD;
window.updateJDField = updateJDField;
window.updateJDStatus = updateJDStatus;



/* =====================================================
   IMPORT / EXPORT ENGINE — ALL TABS
   Ceipal Column Map (xlsx cell refs, 0-indexed after skipping col A):
     B=ProfileStatusID, C=NVR/JobCode, D=JobApplied, E=JobLocation
     F=ClientJobID, G=Client, H=RecruitMgr, I=PrimaryRecruiter
     J=ApplicantID, K=ApplicantName(Full), L=ApplicantLastName
     M=EmailAddress, N=MobileNumber, O=Location, P=Source
     Q=BillRate, R=PayRateTaxTerms, S=ClientBillRate
     T=SubmittedOn, U=SubmittedBy, V=ReqAssignedOn, W=ApplicantFirstName
===================================================== */

/* ── CEIPAL IMPORT (Submission tab only) ── */
function importCeipal(){
  document.getElementById("ceipalFileInput").click();
}

async function handleCeipalFile(input){
  const file = input.files[0];
  if(!file) return;
  input.value = "";

  const btn = document.querySelector("button[onclick='importCeipal()']");
  if(btn){ btn.innerHTML = '<i class="ri-loader-4-line"></i> Importing...'; btn.disabled = true; }

  try {
    const arrayBuf = await file.arrayBuffer();

    /* ── Read using cell-address approach (handles Ceipal's corrupt stylesheet + sparse rows) ── */
    const wb = XLSX.read(arrayBuf, { type:"array", cellDates:false, raw:true, WTF:false });
    const ws = wb.Sheets[wb.SheetNames[0]];

    /* Convert column letter(s) to 0-based index */
    function colLetterToIdx(col){
      col = col.toUpperCase();
      let n = 0;
      for(let i=0; i<col.length; i++) n = n*26 + (col.charCodeAt(i)-64);
      return n - 1;  // 0-based
    }

    /* Get cell value by col-letter + row-number (1-based) */
    function cellVal(col, row){
      const key = col.toUpperCase() + row;
      const cell = ws[key];
      if(!cell) return "";
      if(cell.t === 'n') return String(cell.v);
      return String(cell.v || cell.w || "").trim();
    }

    /* Find the header row — look for "Applicant Name" anywhere in the sheet */
    const range = XLSX.utils.decode_range(ws["!ref"] || "A1:Z200");
    const totalRows = range.e.r + 1;  // 1-based max row
    const totalCols = range.e.c + 1;

    let headerRowNum = -1;
    let colMap = {};  // fieldName → column letter

    for(let r = 1; r <= Math.min(totalRows, 10); r++){
      for(let c = 0; c < totalCols; c++){
        const letter = XLSX.utils.encode_col(c);
        const v = cellVal(letter, r).toLowerCase();
        if(v.includes("applicant name") && !v.includes("last") && !v.includes("first")){
          headerRowNum = r;
          break;
        }
      }
      if(headerRowNum > 0) break;
    }

    if(headerRowNum < 0){ alert("Could not find header row.\nExpected a row with 'Applicant Name'."); return; }

    /* Build column map from header row */
    for(let c = 0; c < totalCols; c++){
      const letter = XLSX.utils.encode_col(c);
      const hdr = cellVal(letter, headerRowNum).toLowerCase().trim();
      if(hdr) colMap[hdr] = letter;
    }

    /* Helper: get column letter by header keyword */
    function colOf(...keywords){
      for(const kw of keywords){
        for(const [hdr, letter] of Object.entries(colMap)){
          if(hdr.includes(kw.toLowerCase())) return letter;
        }
      }
      return null;
    }

    const cName   = colOf("applicant name");   // K — full name (fallback)
    const cFirst  = colOf("applicant first");   // W — first name
    const cLast   = colOf("applicant last");    // L — last name
    const cEmail  = colOf("email address","email");
    const cPhone  = colOf("mobile number","phone","mobile");
    const cNVR    = colOf("job code","id");     // C — NVR#
    const cJob    = colOf("job applied");       // D — job title
    const cClient = colOf("client");            // G
    const cLoc    = colOf("location");          // O — applicant city
    const cSrc    = colOf("submission source","source");
    const cDate   = colOf("submitted on");      // T
    const cBy     = colOf("submitted by");      // U
    const cBill   = colOf("bill rate");         // Q
    const cPay    = colOf("submission pay rate","pay rate");
    const cCBR    = colOf("client bill rate");  // S

    /* Parse Ceipal date  MM/DD/YY HH:MM:SS → YYYY-MM-DD */
    function parseCDate(raw){
      if(!raw) return today();
      const m = String(raw).match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
      if(!m) return today();
      let yr = parseInt(m[3]);
      if(yr < 100) yr += 2000;
      return `${yr}-${String(m[1]).padStart(2,"0")}-${String(m[2]).padStart(2,"0")}`;
    }

    function g(col, row){ return col ? cellVal(col, row) : ""; }

    /* Section-header detector — row with only col A filled and data cols empty */
    function isSectionHeader(r){
      const nameVal  = g(cName,  r);
      const emailVal = g(cEmail, r);
      const nvrVal   = g(cNVR,   r);
      return !nameVal && !emailVal && !nvrVal;
    }

    const inserts = [];
    let skipped = 0;

    for(let r = headerRowNum + 1; r <= totalRows; r++){
      if(isSectionHeader(r)){ skipped++; continue; }

      /* Build full name: First Name + Last Name (W+L), fallback to full name K */
      const firstName = g(cFirst, r).trim();
      const lastName  = g(cLast,  r).trim();
      let name = [firstName, lastName].filter(Boolean).join(" ");
      if(!name) name = g(cName, r).trim();

      const email = g(cEmail, r).trim();
      if(!name && !email){ skipped++; continue; }

      const rawDate = g(cDate, r);
      const bill    = g(cBill, r);
      const pay     = g(cPay,  r);
      const cbr     = g(cCBR,  r);
      const subBy   = g(cBy,   r);

      const notes = [
        subBy                       ? `Submitted by: ${subBy}` : "",
        bill && bill !== "N/A"      ? `Bill Rate: ${bill}`     : "",
        pay  && pay  !== "N/A"      ? `Pay Rate: ${pay}`       : "",
        cbr  && cbr  !== "N/A"      ? `Client Rate: ${cbr}`    : "",
      ].filter(Boolean).join(" | ");

      /* ── FILTER: only import rows submitted by Varada Chari ── */
      const submittedBy = g(cBy, r).trim();
      if(submittedBy.toLowerCase() !== "varada chari"){ skipped++; continue; }

      const srcVal = g(cSrc, r);
      const fullNotes = [notes, srcVal ? `Source: ${srcVal}` : ""].filter(Boolean).join(" | ");

      inserts.push({
        submission_date: parseCDate(rawDate),
        name,
        email,
        phone:       g(cPhone,  r),
        requirement: g(cJob,    r),
        client:      g(cClient, r),
        location:    g(cLoc,    r),
        visa:        "",
        notes:       fullNotes,
      });
    }

    if(inserts.length === 0){
      alert(`No valid records found in the file.\nRows checked: ${totalRows - headerRowNum}\nSkipped (empty/section headers): ${skipped}\n\nMake sure this is a Ceipal Submission Report.`);
      return;
    }

    /* Preview confirm */
    const first = inserts[0];
    const ok = confirm(
      `✅ Ceipal Report Ready to Import\n` +
      `🔍 Filter: Submitted By = Varada Chari only\n\n` +
      `Varada Chari records:  ${inserts.length}\n` +
      `Skipped (other recruiters + empty):  ${skipped}\n\n` +
      `── First Record Preview ──\n` +
      `Name:    ${first.name}\n` +
      `Email:   ${first.email}\n` +
      `Phone:   ${first.phone}\n` +
      `NVR:     ${first.requirement}\n` +
      `Client:  ${first.client}\n` +
      `Date:    ${first.submission_date}\n\n` +
      `Click OK to import into Submissions.`
    );
    if(!ok) return;

    /* Batch insert → Supabase */
    const BATCH = 50;
    let failCount = 0;
    for(let b = 0; b < inserts.length; b += BATCH){
      const chunk = inserts.slice(b, b + BATCH);
      /* Strip any unknown columns before insert */
      const safeChunk = chunk.map(r => ({
        submission_date: r.submission_date || "",
        name:            r.name            || "",
        email:           r.email           || "",
        phone:           r.phone           || "",
        requirement:     r.requirement     || "",
        client:          r.client          || "",
        location:        r.location        || "",
        visa:            r.visa            || "",
        notes:           r.notes           || "",
      }));
      const { error } = await sb.from("submission").insert(safeChunk);
      if(error){
        failCount += chunk.length;
        console.error("Insert batch error:", error.message, JSON.stringify(safeChunk[0]));
      }
    }

    await fetchAllData();
    renderStage("submission", "submissionBody");
    renderKPI();
    switchSection("submission");

    if(failCount > 0){
      alert(`Import finished.\n✅ Imported: ${inserts.length - failCount}\n❌ Failed: ${failCount}\n\nCheck console for error details.`);
    } else {
      alert(`✅ All ${inserts.length} records imported successfully!`);
    }

  } catch(err){
    console.error("Ceipal import error:", err);
    alert("Import failed:\n" + err.message + "\n\nCheck browser console for details.");
  } finally {
    if(btn){ btn.innerHTML = '<i class="ri-file-excel-2-line"></i> Import Ceipal Report'; btn.disabled = false; }
  }
}


/* ══════════════════════════════════════════
   GENERIC IMPORT — all tabs (Excel or CSV)
══════════════════════════════════════════ */
function importGeneric(tab){
  const input = document.getElementById(`importFile_${tab}`);
  if(input) input.click();
}

async function handleGenericImport(input, tab){
  const file = input.files[0];
  if(!file) return;
  input.value = "";

  try {
    const arrayBuf = await file.arrayBuffer();
    /* Use raw:true + cellDates:false to handle corrupt stylesheets gracefully */
    const wb = XLSX.read(arrayBuf, { type:"array", raw:true, cellDates:false });
    const ws = wb.Sheets[wb.SheetNames[0]];

    /* Auto-detect real header row (Ceipal has "Period:" title in row 1) */
    const rawRows = XLSX.utils.sheet_to_json(ws, { header:1, defval:"", raw:false });
    let headerIdx = 0, maxFilled = 0;
    for(let i=0; i<Math.min(rawRows.length,10); i++){
      const filled = rawRows[i].filter(c=>String(c).trim()).length;
      if(filled > maxFilled){ maxFilled = filled; headerIdx = i; }
    }
    const headers = rawRows[headerIdx].map(h=>String(h).trim());
    const rows = [];
    for(let i=headerIdx+1; i<rawRows.length; i++){
      const obj = {};
      headers.forEach((h,ci)=>{ if(h) obj[h] = String(rawRows[i][ci]||"").trim(); });
      rows.push(obj);
    }

    if(!rows.length){ alert("No data found in file."); return; }

    /* Exact date field per table */
    const DATE_FIELD = {
      daily:"entry_date", submission:"submission_date", proposal:"proposal_date",
      interview:"interview_scheduled_on", placement:"placement_date", start:"start_date"
    };
    const dateField = DATE_FIELD[tab] || "entry_date";

    /* Exact allowed columns per table — matches Supabase schema exactly */
    const allowed = TABLE_COLS[tab] || [];

    const norm = s => String(s||"").toLowerCase().replace(/[^a-z0-9]/g,"");

    /* Find value in a row by fuzzy column name match */
    function fv(row, ...keys){
      for(const k of keys){
        for(const rk of Object.keys(row)){
          if(norm(rk).includes(norm(k))) return String(row[rk]||"").trim();
        }
      }
      return "";
    }

    /* Parse date: MM/DD/YY, MM/DD/YYYY, YYYY-MM-DD */
    function pd(raw){
      if(!raw) return today();
      const s = String(raw);
      const m1 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
      if(m1){ let y=parseInt(m1[3]); if(y<100)y+=2000; return `${y}-${m1[1].padStart(2,"0")}-${m1[2].padStart(2,"0")}`; }
      if(/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0,10);
      return today();
    }

    const inserts = [];
    rows.forEach(row => {
      /* Build every possible field */
      const all = {
        entry_date:             pd(fv(row,"date","entry")),
        submission_date:        pd(fv(row,"submitted on","submission date","sub date","date")),
        proposal_date:          pd(fv(row,"proposal date","date")),
        interview_scheduled_on: pd(fv(row,"interview date","interview","date")),
        placement_date:         pd(fv(row,"placement date","date")),
        start_date:             pd(fv(row,"start date","date")),
        name:        (()=>{
                       const fn = fv(row,"applicant first","first name");
                       const ln = fv(row,"applicant last","last name");
                       if(fn||ln) return [fn,ln].filter(Boolean).join(" ");
                       return fv(row,"applicant name","name","candidate","full name");
                     })(),
        email:       fv(row,"email address","email"),
        phone:       fv(row,"mobile number","phone","mobile","contact"),
        requirement: fv(row,"job applied","requirement","job","nvr","position","title"),
        client:      fv(row,"client","company","end client"),
        location:    fv(row,"location","city","address"),
        visa:        fv(row,"visa","work auth","authorization"),
        source:      fv(row,"source"),
        notes:       fv(row,"notes","comments","remark"),
        program_name:fv(row,"program name","program"),
        pw_name:     fv(row,"pw name","pw"),
        resume_text: fv(row,"resume text","resume"),
        ai_score:    fv(row,"ai score","score") || null,
        ai_notes:    fv(row,"ai notes"),
      };

      /* Skip rows with no name AND no email */
      if(!all.name && !all.email) return;

      /* Submission tab: only Varada Chari's records */
      if(tab === "submission"){
        const subBy = fv(row,"submitted by").toLowerCase();
        if(subBy && subBy !== "varada chari") return;
      }

      /* Build safe record — ONLY columns that exist in this table */
      const rec = {};
      allowed.forEach(col => {
        const val = all[col];
        rec[col] = val !== undefined && val !== null ? val : "";
      });

      inserts.push(rec);
    });

    if(!inserts.length){
      alert("No valid records found.\nFile must have at least a Name or Email column.");
      return;
    }

    const tabName = tab.charAt(0).toUpperCase() + tab.slice(1);
    const first   = inserts[0];
    const ok = confirm(
      `Import ${inserts.length} records into ${tabName}?\n\n` +
      `── First Record ──\n` +
      `Name:  ${first.name || ""}\n` +
      `Email: ${first.email || ""}\n` +
      `Date:  ${first[dateField] || ""}\n` +
      `NVR:   ${first.requirement || ""}\n` +
      `Client:${first.client || ""}\n\n` +
      `Columns to import: ${Object.keys(first).join(", ")}`
    );
    if(!ok) return;

    const BATCH = 50;
    let fails = 0;
    for(let b = 0; b < inserts.length; b += BATCH){
      const chunk = inserts.slice(b, b + BATCH);
      const { error } = await sb.from(tab).insert(chunk);
      if(error){
        fails += chunk.length;
        console.error(`[${tab}] insert error:`, error.message, JSON.stringify(chunk[0]));
      }
    }

    await fetchAllData();
    if(tab === "daily") renderDaily();
    else renderStage(tab, tab + "Body");
    renderKPI();
    switchSection(tab);

    alert(
      fails > 0
        ? `Import done.\n✅ Imported: ${inserts.length - fails}\n❌ Failed: ${fails}\n\nCheck browser console for details.`
        : `✅ ${inserts.length} records imported into ${tabName} successfully!`
    );

  } catch(err){
    console.error("Generic import error:", err);
    alert("Import failed: " + err.message);
  }
}

/* ── Expose functions to window so HTML onchange/onclick can reach them ── */
window.changeStage         = changeStage;
window.changeDailyPage     = changeDailyPage;
window.handleCeipalFile    = handleCeipalFile;
window.scoreCandidate      = scoreCandidate;
window.handleGenericImport = handleGenericImport;
window.updateFieldById     = updateFieldById;
window.exportTab           = function(tab){ console.warn("Export coming soon for:", tab); };
