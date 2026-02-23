/* =========================================================
   NETVISION ATS – ENTERPRISE ARCHITECTURE VERSION
========================================================= */

/* =========================
   1. CONFIG LAYER
========================= */

const SUPABASE_URL = "https://ftxrrgdmkpnghxilnpsk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0eHJyZ2Rta3BuZ2h4aWxucHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MDY0MzYsImV4cCI6MjA4NzE4MjQzNn0.KcqIN2ynBQWmglQ_-6eaFi3TGPSclB0TgeJ83XU_OWI";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const $ = (id) => document.getElementById(id);
const today = () => new Date().toISOString().split("T")[0];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];


/* =========================
   2. API SERVICE LAYER
========================= */

const DB = {

  async getAll(table, orderField=null) {
    let query = supabase.from(table).select("*");
    if(orderField) query = query.order(orderField, {ascending:false});
    const { data, error } = await query;
    if(error) console.error(error);
    return data || [];
  },

  async insert(table, payload) {
    const { error } = await supabase.from(table).insert([payload]);
    if(error) console.error(error);
  },

  async delete(table, id) {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if(error) console.error(error);
  },

  async copy(fromTable, toTable, id, extra={}) {
    const { data } = await supabase.from(fromTable).select("*").eq("id",id).single();
    if(!data) return;
    delete data.id;
    await this.insert(toTable, { ...data, ...extra });
  }

};


/* =========================
   3. UI RENDER LAYER
========================= */

const UI = {

  async renderJD() {
    const data = await DB.getAll("jd","date");
    $("jdBody").innerHTML="";
    $("dailyRequirement").innerHTML="<option value=''>Select</option>";

    data.forEach(r=>{
      $("jdBody").innerHTML += `
        <tr>
          <td>${r.date||""}</td>
          <td>${r.nvr||""}</td>
          <td>${r.title||""}</td>
          <td>${r.client||""}</td>
          <td>${r.status||""}</td>
          <td><button data-del="jd" data-id="${r.id}">Del</button></td>
        </tr>`;

      if(r.status==="Active"){
        $("dailyRequirement").innerHTML +=
        `<option value="${r.nvr}" data-client="${r.client}">
          ${r.nvr} - ${r.title}
        </option>`;
      }
    });
  },

  async renderDaily() {
    const data = await DB.getAll("daily","entry_date");
    $("dailyBody").innerHTML="";

    data.forEach(r=>{
      $("dailyBody").innerHTML += `
      <tr>
        <td>${r.name}</td>
        <td>${r.requirement||""}</td>
        <td>${r.client||""}</td>
        <td>
          <button data-copy="daily|submission|${r.id}">Sub</button>
          <button data-copy="daily|proposal|${r.id}">Proposal</button>
          <button data-del="daily" data-id="${r.id}">Del</button>
        </td>
      </tr>`;
    });
  },

  async renderGeneric(table, bodyId, dateField=null) {
    const data = await DB.getAll(table, dateField);
    $(bodyId).innerHTML="";

    data.forEach(r=>{
      $(bodyId).innerHTML += `
        <tr>
          <td>${r.name||""}</td>
          <td>${r.client||""}</td>
          <td>${r.status||r.result||""}</td>
          <td>
            <button data-del="${table}" data-id="${r.id}">Del</button>
          </td>
        </tr>`;
    });
  },

  async renderKPI() {

    const sub = await DB.getAll("submission");
    const int = await DB.getAll("interview");
    const place = await DB.getAll("placement");
    const start = await DB.getAll("start");

    $("kpiSub").innerText = sub.length;
    $("kpiInt").innerText = int.length;
    $("kpiPlace").innerText = place.length;
    $("kpiStart").innerText = start.length;

    const monthly = $("monthlyBody");
    monthly.innerHTML="";

    for(let m=0;m<12;m++){
      const subC = sub.filter(r=>r.submission_date && new Date(r.submission_date).getMonth()===m).length;
      const intC = int.filter(r=>r.interview_scheduled_on && new Date(r.interview_scheduled_on).getMonth()===m).length;
      const placeC = place.filter(r=>r.placement_date && new Date(r.placement_date).getMonth()===m).length;
      const startC = start.filter(r=>r.start_date && new Date(r.start_date).getMonth()===m).length;

      monthly.innerHTML += `
        <tr>
          <td>${MONTHS[m]}</td>
          <td>${subC}</td>
          <td>${intC}</td>
          <td>${placeC}</td>
          <td>${startC}</td>
        </tr>`;
    }
  }

};


/* =========================
   4. CONTROLLER
========================= */

const Controller = {

  async addJD(){
    await DB.insert("jd",{
      date:$("jdDate").value,
      nvr:$("jdNvr").value,
      title:$("jdTitle").value,
      client:$("jdClient").value,
      status:$("jdStatus").value
    });
    App.reload();
  },

  async addDaily(){
    await DB.insert("daily",{
      entry_date:today(),
      name:$("dailyName").value,
      email:$("dailyEmail").value,
      phone:$("dailyPhone").value,
      visa:$("dailyVisa").value,
      requirement:$("dailyRequirement").value,
      client:$("dailyClient").value,
      source:$("dailySource").value,
      location:$("dailyLocation").value,
      notes:$("dailyNotes").value
    });
    App.reload();
  }

};


/* =========================
   5. EVENTS + ROUTER
========================= */

function initRouter(){
  document.querySelectorAll("[data-tab]").forEach(tab=>{
    tab.addEventListener("click",function(){
      document.querySelectorAll(".section").forEach(s=>s.classList.remove("active"));
      document.querySelectorAll(".sidebar a").forEach(a=>a.classList.remove("active"));
      this.classList.add("active");
      $(this.dataset.tab).classList.add("active");
    });
  });
}

function initEvents(){

  $("addJD")?.addEventListener("click",Controller.addJD);
  $("addDaily")?.addEventListener("click",Controller.addDaily);

  document.addEventListener("click",async (e)=>{

    if(e.target.dataset.del){
      await DB.delete(e.target.dataset.del, e.target.dataset.id);
      App.reload();
    }

    if(e.target.dataset.copy){
      const [from,to,id] = e.target.dataset.copy.split("|");
      await DB.copy(from,to,id,{});
      App.reload();
    }

  });

  $("dailyRequirement")?.addEventListener("change",function(){
    const selected=this.options[this.selectedIndex];
    $("dailyClient").value = selected.getAttribute("data-client")||"";
  });

}


/* =========================
   6. APP
========================= */

const App = {

  async reload(){
    await UI.renderJD();
    await UI.renderDaily();
    await UI.renderGeneric("submission","submissionBody","submission_date");
    await UI.renderGeneric("proposal","proposalBody","proposal_date");
    await UI.renderGeneric("interview","interviewBody","interview_scheduled_on");
    await UI.renderGeneric("placement","placementBody","placement_date");
    await UI.renderGeneric("start","startBody","start_date");
    await UI.renderGeneric("tasks","taskBody","due_date");
    await UI.renderGeneric("meetings","meetingBody","meeting_date");
    await UI.renderKPI();
  },

  init(){
    initRouter();
    initEvents();
    this.reload();
  }

};

document.addEventListener("DOMContentLoaded", ()=>App.init());