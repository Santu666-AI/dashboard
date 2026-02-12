/* ========= SUPABASE CONFIG ========= */

const SUPABASE_URL = "https://jpmmciputroyyrjmyeya.supabase.co";
const SUPABASE_KEY = "sb_publishable_afZSYp99Z_Xwb5Wl_W7J8g_m7fPHPTE";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const el = id => document.getElementById(id);

/* ========= LOGIN ========= */

function checkLogin(){
  if(localStorage.getItem("logged") !== "yes"){
    location.href="index.html";
  }
}

function logout(){
  localStorage.removeItem("logged");
  location.href="index.html";
}

/* ========= RESUME PARSER ========= */

function parseResume(t){
  if(!t) return;
  const e = t.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if(e && !el("rpEmail").value) el("rpEmail").value = e[0];
}

/* ========= SAVE DAILY ========= */

async function saveToDaily(){

await supabaseClient.from("daily").insert([{
date:new Date().toISOString(),
name:el("rpName").value,
email:el("rpEmail").value,
phone:el("rpPhone").value,
job:"",
client:"",
source:"",
location:el("rpLocation").value,
visa:el("rpVisa").value,
followup:"",
notes:""
}]);

loadDaily();
}

/* ========= LOAD DAILY ========= */

async function loadDaily(){

const {data} = await supabaseClient
.from("daily")
.select("*")
.order("id",{ascending:false});

const t = el("dailyTable");
if(!t) return;

t.innerHTML="";

data.forEach((r,i)=>{
t.innerHTML+=`
<tr>
<td>${i+1}</td>
<td>${r.date?.split("T")[0]||""}</td>
<td>${r.name||""}</td>
<td>${r.email||""}</td>
<td>${r.phone||""}</td>
<td>${r.job||""}</td>
<td>${r.client||""}</td>
<td>${r.source||""}</td>
<td>${r.location||""}</td>
<td>${r.visa||""}</td>
<td>${r.followup||""}</td>
<td>${r.notes||""}</td>
<td></td>
</tr>`;
});

loadHome();
}

/* ========= HOME KPI ========= */

async function loadHome(){

const sub = await supabaseClient.from("submission").select("*",{count:"exact"});
const inter = await supabaseClient.from("interview").select("*",{count:"exact"});
const place = await supabaseClient.from("placement").select("*",{count:"exact"});
const start = await supabaseClient.from("start").select("*",{count:"exact"});

el("subCount").innerText=sub.count||0;
el("intCount").innerText=inter.count||0;
el("placeCount").innerText=place.count||0;
el("startCount").innerText=start.count||0;
}

/* ========= JD ========= */

async function saveJD(){

await supabaseClient.from("jd").insert([{
date:new Date().toISOString(),
nvr:el("jdNvr").value,
subject:el("jdSubject").value,
text:el("jdText").value,
status:el("jdStatus").value
}]);

loadJD();
}

async function loadJD(){

const {data} = await supabaseClient.from("jd").select("*").order("id",{ascending:false});

const t = el("jdTable");
if(!t) return;
t.innerHTML="";

data.forEach(r=>{
t.innerHTML+=`
<tr>
<td>${r.date?.split("T")[0]}</td>
<td>${r.nvr}</td>
<td>${r.subject}</td>
<td>${r.status}</td>
<td></td>
</tr>`;
});
}

/* ========= INIT ========= */

window.onload=()=>{
checkLogin();
loadDaily();
loadJD();
};
