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
   JD MANAGEMENT (FIXED)
========================================================== */

async function saveJD(){

  const row = {
    date: now(),
    jdnvr: el("jdNvr").value,
    jdsubject: el("jdSubject").value,
    jdtext: el("jdText").value,
    jdstatus: el("jdStatus").value
  };

  const {error} = await supabaseClient.from("jd").insert([row]);
  if(error){ console.error(error); alert(error.message); return; }

  el("jdNvr").value="";
  el("jdSubject").value="";
  el("jdText").value="";

  loadJD();
  loadActiveJDs();
}

async function loadJD(){

  const table = el("jdTable");
  if(!table){ console.log("jdTable not found"); return; }

  const {data,error} = await supabaseClient
    .from("jd")
    .select("*")
    .order("id",{ascending:false});

  if(error){ console.error(error); return; }

  table.innerHTML="";

  (data||[]).forEach(j=>{
    table.innerHTML+=`
      <tr>
        <td>${j.date ? j.date.split("T")[0]:""}</td>
        <td>${j.jdnvr||""}</td>
        <td>${j.jdsubject||""}</td>
        <td>${j.jdstatus||""}</td>
        <td>
          <button class="btn btn-sm btn-danger"
            onclick="deleteRow('jd',${j.id})">Delete</button>
        </td>
      </tr>
    `;
  });
}

async function loadActiveJDs(){

  const {data,error} = await supabaseClient
    .from("jd")
    .select("jdsubject")
    .eq("jdstatus","Active");

  if(error){ console.error(error); return; }

  const select = el("dailyJobSelect");
  if(!select) return;

  select.innerHTML=`<option value="">Select Active Requirement</option>`;

  (data||[]).forEach(j=>{
    select.innerHTML+=`
      <option value="${j.jdsubject}">
        ${j.jdsubject}
      </option>`;
  });
}



/* ==========================================================
   SAVE DAILY
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
    notes: ""
  };

  const {error}=await supabaseClient.from("daily").insert([row]);
  if(error){ console.error(error); alert(error.message); return; }

  loadDaily();
}



/* ==========================================================
   LOAD DAILY
========================================================== */

async function loadDaily(){

  const table=el("dailyTable");
  if(!table){ console.log("dailyTable not found"); return; }

  const {data,error}=await supabaseClient
    .from("daily")
    .select("*")
    .order("id",{ascending:false});

  if(error){ console.error(error); return; }

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
        <td></td>
        <td class="text-nowrap">
          <button class="btn btn-sm btn-primary"
            onclick="copyToStage(${r.id},'submission')">Sub</button>
          <button class="btn btn-sm btn-warning"
            onclick="copyToStage(${r.id},'proposal')">Prop</button>
          <button class="btn btn-sm btn-danger"
            onclick="deleteRow('daily',${r.id})">X</button>
        </td>
      </tr>`;
  });

  updateKPIs();
}



/* ==========================================================
   COPY TO STAGE (FIXED)
========================================================== */

async function copyToStage(id,target){

  const {data,error}=await supabaseClient
    .from("daily")
    .select("*")
    .eq("id",id)
    .single();

  if(error){ console.error(error); return; }
  if(!data) return;

  delete data.id;

  await supabaseClient.from(target).insert([data]);

  loadStage(target);
  updateKPIs();
}



/* ==========================================================
   LOAD STAGES (FULL FIXED)
========================================================== */

async function loadStage(tab){

  const container=el(tab);
  if(!container){ console.log(tab+" container missing"); return; }

  const {data,error}=await supabaseClient
    .from(tab)
    .select("*")
    .order("id",{ascending:false});

  if(error){ console.error(error); return; }

  container.innerHTML=`
    <table class="table table-bordered">
      <thead>
        <tr>
          <th>Date</th>
          <th>Name</th>
          <th>Email</th>
          <th>Phone</th>
          <th>Job</th>
          <th>Client</th>
          ${tab==="submission"?"<th>Move</th>":""}
          <th>Delete</th>
        </tr>
      </thead>
      <tbody>
        ${(data||[]).map(r=>`
          <tr>
            <td>${r.date?r.date.split("T")[0]:""}</td>
            <td>${r.name||""}</td>
            <td>${r.email||""}</td>
            <td>${r.phone||""}</td>
            <td>${r.job||""}</td>
            <td>${r.client||""}</td>
            ${tab==="submission"?`
              <td>
                <button class="btn btn-sm btn-info"
                  onclick="copyToStage(${r.id},'interview')">Int</button>
                <button class="btn btn-sm btn-success"
                  onclick="copyToStage(${r.id},'placement')">Place</button>
                <button class="btn btn-sm btn-dark"
                  onclick="copyToStage(${r.id},'start')">Start</button>
              </td>`:""}
            <td>
              <button class="btn btn-sm btn-danger"
                onclick="deleteRow('${tab}',${r.id})">X</button>
            </td>
          </tr>`).join("")}
      </tbody>
    </table>`;
}



/* ==========================================================
   DELETE
========================================================== */

async function deleteRow(table,id){
  if(!confirm("Delete entry?")) return;

  await supabaseClient.from(table).delete().eq("id",id);

  if(table==="daily") loadDaily();
  else if(table==="jd") loadJD();
  else loadStage(table);

  updateKPIs();
}



/* ==========================================================
   KPI
========================================================== */

async function updateKPIs(){

  const sub=await supabaseClient.from("submission").select("*");
  const int=await supabaseClient.from("interview").select("*");
  const pla=await supabaseClient.from("placement").select("*");
  const sta=await supabaseClient.from("start").select("*");

  if(el("subCount")) el("subCount").innerText=sub.data?.length||0;
  if(el("intCount")) el("intCount").innerText=int.data?.length||0;
  if(el("placeCount")) el("placeCount").innerText=pla.data?.length||0;
  if(el("startCount")) el("startCount").innerText=sta.data?.length||0;
}



/* ==========================================================
   INIT
========================================================== */

window.addEventListener("load",()=>{

  checkLogin();

  loadJD();
  loadActiveJDs();
  loadDaily();

  loadStage("submission");
  loadStage("proposal");
  loadStage("interview");
  loadStage("placement");
  loadStage("start");

  updateKPIs();
});
