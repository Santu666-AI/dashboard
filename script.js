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

const PAGE_SIZE = 30;

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
  resume_text: resumeText.value
};

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
          <td colspan="14">
            ${formatDisplayDate(date)}
          </td>
        </tr>
      `;

      grouped[date].forEach((r,index)=>{

        dailyBody.innerHTML += `
          <tr>
            <td>${index+1}</td>
            <td>
              <input type="date"
                value="${r.entry_date||''}"
                style="background:#0f172a;border:1px solid #1f2a3a;color:#f1f5f9;border-radius:6px;padding:4px 6px;font-size:12px;width:130px;"
                onchange="updateDate('daily','${r.id}',this.value)">
            </td>

            <td>
            <a href="#" onclick="viewResume(${DB.daily.indexOf(r)})" style="color:#1a73e8;font-weight:600;text-decoration:none;">
            ${r.name||""}
            </a>
            </td>

            <td>${r.email||""}</td>
            <td>${r.phone||""}</td>
            <td>${r.requirement||""}</td>
            <td>${r.client||""}</td>
            <td>${r.location||""}</td>
            <td>${r.visa||""}</td>
            <td>${r.source||""}</td>
            <td>
            <input value="${r.notes||''}"
              placeholder="Add notes..."
              style="background:#0f172a;border:1px solid #1f2a3a;color:#f1f5f9;border-radius:6px;padding:4px 8px;font-size:12px;width:160px;"
              onchange="updateNoteById('daily','${r.id}',this.value)">
            </td>

            <td style="font-weight:bold;">
            ${r.ai_score ?? ""}
            </td>

           <td>
           ${r.ai_notes || ""}
           </td>

            <td>
           <button onclick="moveDailyToSubmission('${r.id}')">Sub</button>
           <button onclick="moveDailyToProposal('${r.id}')">Proposal</button>
           <button onclick="deleteRow('daily',${DB.daily.indexOf(r)})">Del</button>
          </td>
          </tr>
        `;
      });

    });
}

/* ================= STAGE MOVEMENT (FINAL CLEAN ARCHITECTURE) ================= */


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

  body.innerHTML = "";

  const sorted = [...DB[stage]].sort((a,b)=>{

    const dateField =
      stage === "submission" ? "submission_date" :
      stage === "proposal" ? "proposal_date" :
      stage === "interview" ? "interview_scheduled_on" :
      stage === "placement" ? "placement_date" :
      stage === "start" ? "start_date" : "";

    return new Date(b[dateField]) - new Date(a[dateField]);

  });

  sorted.forEach((r,index)=>{

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

<td>${index+1}</td>

<td>
  <input type="date"
    value="${r.submission_date || r.proposal_date || r.interview_scheduled_on || r.placement_date || r.start_date || ''}"
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
row += `
<td>${r.program_name||""}</td>
<td>${r.pw_name||""}</td>
`;
}

row += `
<td>${r.location||""}</td>

<td>${r.visa||""}</td>

<td>
<input value="${r.notes||''}"
  placeholder="Add notes..."
  style="background:#0f172a;border:1px solid #1f2a3a;color:#f1f5f9;border-radius:6px;padding:4px 8px;font-size:12px;width:160px;"
  onchange="updateNoteById('${stage}','${r.id}',this.value)">
</td>

<td>
${actionButtons}
<button onclick="deleteRowById('${stage}','${r.id}')">Del</button>
</td>

</tr>
`;

body.innerHTML += row;
  });

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

    let { data: jd } = await sb.from("jd").select("*");
    DB.jd = jd || [];

    let { data: daily } = await sb.from("daily").select("*");
    DB.daily = daily || [];

    let { data: submission } = await sb.from("submission").select("*");
    DB.submission = submission || [];

    let { data: proposal } = await sb.from("proposal").select("*");
    DB.proposal = proposal || [];

    let { data: interview } = await sb.from("interview").select("*");
    DB.interview = interview || [];

    let { data: placement } = await sb.from("placement").select("*");
    DB.placement = placement || [];

    let { data: start } = await sb.from("start").select("*");
    DB.start = start || [];

    let { data: tasks } = await sb.from("tasks").select("*");
    DB.tasks = tasks || [];

    let { data: meetings } = await sb.from("meetings").select("*");
    DB.meetings = meetings || [];

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

  /* ── EXTENSION HANDOFF ──────────────────────────────────
     popup.js encodes candidate data in URL hash:
     dashboard.html#candidate={...json...}
     This works on ANY website — no chrome.storage needed.
  ─────────────────────────────────────────────────────── */
  try {
    const hash = window.location.hash;
    if (hash && hash.startsWith("#candidate=")) {
      const encoded = hash.replace("#candidate=", "");
      const data = JSON.parse(decodeURIComponent(encoded));

      // Clean the URL so refresh doesn't re-fill
      window.history.replaceState(null, "", window.location.pathname);

      // Switch to Resume Parser
      switchSection("resume");

      // Fill resume textarea
      const resumeEl = document.getElementById("resumeText");
      if (resumeEl) resumeEl.value = data.resume_text || "";

      // Fill all fields
      const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ""; };
      set("resumeName",     data.name);
      set("resumeEmail",    data.email);
      set("resumePhone",    data.phone);
      set("resumeLocation", data.location);
      set("dailyName",      data.name);
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

      // Add Go to Daily button
      if (!document.getElementById("extGoToDailyBtn")) {
        const btn = document.createElement("button");
        btn.id = "extGoToDailyBtn";
        btn.textContent = "✅ Done — Save to Daily Tracker";
        btn.style.cssText = "margin-top:16px;background:#3b82f6;color:#fff;padding:10px 24px;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;display:inline-block;";
        btn.onclick = () => { switchSection("daily"); };
        const sec = document.getElementById("resume");
        if (sec) sec.appendChild(btn);
      }

      if (resumeEl) resumeEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  } catch(e) {
    console.log("Extension handoff error:", e.message);
  }

});