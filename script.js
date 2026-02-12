/* ==========================================================
   SUPABASE CONNECTION
========================================================== */

const SUPABASE_URL = "https://jpmmciputroyyrjmyeya.supabase.co";
const SUPABASE_KEY = "sb_publishable_afZSYp99Z_Xwb5Wl_W7J8g_m7fPHPTE";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const el = id => document.getElementById(id);
const now = () => new Date().toISOString();



/* ==========================================================
   LOGIN
========================================================== */

function login(){
  const u = el("username")?.value.trim();
  const p = el("password")?.value.trim();

  if(u==="admin" && p==="admin"){
    localStorage.setItem("logged","yes");
    window.location.href="dashboard.html";
  }else{
    alert("Invalid Username or Password");
  }
}

function checkLogin(){
  if(localStorage.getItem("logged")!=="yes"){
    window.location.href="index.html";
  }
}

function logout(){
  localStorage.removeItem("logged");
  window.location.href="index.html";
}



/* ==========================================================
   ADVANCED RESUME PARSER (CORRECT FIELD MAPPING)
========================================================== */

function parseResume(text){

  if(!text) return;

  const lines = text.split("\n")
    .map(l=>l.trim())
    .filter(l=>l.length>0);

  /* EMAIL */
  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if(emailMatch){
    el("rpEmail").value=emailMatch[0];
  }

  /* PHONE (handles +1, (), spaces, dashes etc) */
  const phoneMatch = text.match(/(\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
  if(phoneMatch){
    el("rpPhone").value=phoneMatch[0];
  }

  /* NAME (first clean readable line) */
  for(let line of lines){
    if(
      !line.includes("@") &&
      !line.match(/\d{3}/) &&
      line.length < 40
    ){
      el("rpName").value=line;
      break;
    }
  }

  /* LOCATION (City, State OR USA formats) */
  const locationMatch = text.match(
    /([A-Z][a-z]+,\s?[A-Z]{2}|[A-Z][a-z]+\s[A-Z][a-z]+,\s?[A-Z]{2}|United States|USA)/i
  );
  if(locationMatch){
    el("rpLocation").value=locationMatch[0];
  }
}



/* ==========================================================
   SAVE TO DAILY (NO RESUME TEXT SAVED)
========================================================== */

async function saveToDaily(){

  if(!el("dailyJobSelect").value)
    return alert("Select Active Requirement");

  const row={
    date: now(),
    name: el("rpName").value,
    email: el("rpEmail").value,
    phone: el("rpPhone").value,
    job: el("dailyJobSelect").value,
    client: el("dailyClientInput").value,
    location: el("rpLocation").value,
    visa: el("rpVisa").value,
    notes: ""   // Never save resume body
  };

  const {error}=await supabaseClient.from("daily").insert([row]);
  if(error){ alert(error.message); return; }

  /* CLEAR RESUME FORM */
  [
    "rpName","rpEmail","rpPhone","rpLocation",
    "rpVisa","rpNotes","dailyJobSelect","dailyClientInput"
  ].forEach(id=>{
    if(el(id)) el(id).value="";
  });

  loadDaily();
}



/* ==========================================================
   COPY PIPELINE
========================================================== */

async function copyToStage(id,target){

  const {data}=await supabaseClient
    .from("daily")
    .select("*")
    .eq("id",id)
    .single();

  if(!data) return;

  delete data.id;

  await supabaseClient.from(target).insert([data]);

  loadStage(target);
  updateKPIs();
}



/* ==========================================================
   DELETE
========================================================== */

async function deleteRow(table,id){

  if(!confirm("Delete entry?")) return;

  await supabaseClient.from(table).delete().eq("id",id);

  if(table==="daily") loadDaily();
  else loadStage(table);

  updateKPIs();
}



/* ==========================================================
   UPDATE NOTES
========================================================== */

async function updateNotes(table,id,value){
  await supabaseClient.from(table)
    .update({notes:value})
    .eq("id",id);
}



/* ==========================================================
   LOAD DAILY (CLEAN BUTTONS, NO OVERLAP)
========================================================== */

async function loadDaily(){

  const table=el("dailyTable");
  if(!table) return;

  const {data}=await supabaseClient
    .from("daily")
    .select("*")
    .order("id",{ascending:false});

  table.innerHTML="";

  (data||[]).forEach((r,i)=>{

    table.innerHTML+=`
      <tr>
        <td>${i+1}</td>
        <td>${r.date?r.date.split("T")[0]:""}</td>
        <td>${r.name||""}</td>
        <td>${r.email||""}</td>
        <td>${r.phone||""}</td>
        <td>${r.job||""}</td>
        <td>${r.client||""}</td>
        <td>${r.location||""}</td>
        <td>${r.visa||""}</td>
        <td>
          <textarea class="form-control form-control-sm"
            onchange="updateNotes('daily',${r.id},this.value)">
            ${r.notes||""}
          </textarea>
        </td>
        <td class="text-nowrap">
          <button class="btn btn-sm btn-primary me-1"
            onclick="copyToStage(${r.id},'submission')">Sub</button>
          <button class="btn btn-sm btn-warning me-1"
            onclick="copyToStage(${r.id},'proposal')">Prop</button>
          <button class="btn btn-sm btn-danger"
            onclick="deleteRow('daily',${r.id})">X</button>
        </td>
      </tr>
    `;
  });

  updateKPIs();
}



/* ==========================================================
   LOAD STAGES
========================================================== */

async function loadStage(tab){

  const container=el(tab);
  if(!container) return;

  const {data}=await supabaseClient
    .from(tab)
    .select("*")
    .order("id",{ascending:false});

  container.innerHTML=`
    <table class="table table-bordered">
      <thead>
        <tr>
          <th>Date</th><th>Name</th><th>Email</th>
          <th>Job</th><th>Client</th><th>Notes</th>
          ${tab==="submission"?"<th>Move</th>":""}
          <th>Delete</th>
        </tr>
      </thead>
      <tbody>
        ${(data||[]).map(r=>`
          <tr>
            <td>
              <input type="date" class="form-control form-control-sm"
                value="${r.date?r.date.split("T")[0]:""}"
                onchange="supabaseClient.from('${tab}')
                .update({date:this.value})
                .eq('id',${r.id})">
            </td>
            <td>${r.name||""}</td>
            <td>${r.email||""}</td>
            <td>${r.job||""}</td>
            <td>${r.client||""}</td>
            <td>
              <textarea class="form-control form-control-sm"
                onchange="updateNotes('${tab}',${r.id},this.value)">
                ${r.notes||""}
              </textarea>
            </td>
            ${tab==="submission"?`
              <td class="text-nowrap">
                <button class="btn btn-sm btn-info me-1"
                  onclick="copyToStage(${r.id},'interview')">Int</button>
                <button class="btn btn-sm btn-success me-1"
                  onclick="copyToStage(${r.id},'placement')">Place</button>
                <button class="btn btn-sm btn-dark"
                  onclick="copyToStage(${r.id},'start')">Start</button>
              </td>`:""}
            <td>
              <button class="btn btn-sm btn-danger"
                onclick="deleteRow('${tab}',${r.id})">X</button>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}



/* ==========================================================
   KPI + HOME
========================================================== */

async function updateKPIs(){

  const sub=await supabaseClient.from("submission").select("*");
  const int=await supabaseClient.from("interview").select("*");
  const pla=await supabaseClient.from("placement").select("*");
  const sta=await supabaseClient.from("start").select("*");

  el("subCount").innerText=sub.data?.length||0;
  el("intCount").innerText=int.data?.length||0;
  el("placeCount").innerText=pla.data?.length||0;
  el("startCount").innerText=sta.data?.length||0;

  renderHome();
}
