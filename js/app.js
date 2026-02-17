import { store } from "./store.js";
import { getAllRings } from "./api.js";
import { showView, currentViewFromHash } from "./router.js";
import { renderCrud, refreshCrud } from "./modules/crud.js";
import { renderControl, refreshControl } from "./modules/control.js";
import { renderMonitor, refreshMonitor } from "./modules/monitor.js";

const statTotal = document.getElementById("statTotal");
const statLastLoad = document.getElementById("statLastLoad");
const statStatus = document.getElementById("statStatus");

const btnGlobalReload = document.getElementById("btnGlobalReload");
const globalSearch = document.getElementById("globalSearch");
const globalFilterEstado = document.getElementById("globalFilterEstado");
const btnGlobalClear = document.getElementById("btnGlobalClear");

// Toast
const toastEl = document.getElementById("appToast");
const toastMsg = document.getElementById("toastMsg");
const toast = new bootstrap.Toast(toastEl, { delay: 2400 });

function setStatusBadge(text, type="secondary"){
  statStatus.innerHTML = `<span class="badge rounded-pill text-bg-${type}">${text}</span>`;
}

function toastMsgFn(msg){
  toastMsg.textContent = msg;
  toast.show();
}

// Hacer accesible a módulos
window.__toast = toastMsgFn;

window.__reload = async function reload(){
  setStatusBadge("Cargando...", "info");
  try{
    store.rings = await getAllRings();
    store.lastLoad = new Date();
    statTotal.textContent = String(store.rings.length);
    statLastLoad.textContent = store.lastLoad.toLocaleTimeString();
    setStatusBadge("OK", "success");

    // refrescar vista actual
    refreshAllViews();
  }catch(e){
    console.error(e);
    setStatusBadge("Error", "danger");
    toastMsgFn("Error al cargar datos ❌");
  }
};

function refreshAllViews(){
  refreshCrud();
  refreshControl();
  refreshMonitor();
}

function route(){
  const view = currentViewFromHash();
  showView(view);

  // si aún no están renderizadas las vistas, renderearlas 1 vez
  if(!document.getElementById("crudBody")) renderCrud();
  if(!document.getElementById("controlGrid")) renderControl();
  if(!document.getElementById("monCharts")) renderMonitor();

  refreshAllViews();
}

// eventos globales
btnGlobalReload.addEventListener("click", window.__reload);

btnGlobalClear.addEventListener("click", ()=>{
  store.globalSearch = "";
  store.globalEstado = "";
  globalSearch.value = "";
  globalFilterEstado.value = "";
  refreshAllViews();
});

globalSearch.addEventListener("input", ()=>{
  store.globalSearch = globalSearch.value;
  refreshAllViews();
});

globalFilterEstado.addEventListener("change", ()=>{
  store.globalEstado = globalFilterEstado.value;
  refreshAllViews();
});

window.addEventListener("hashchange", route);

// init
(async function init(){
  // defaults
  if(!location.hash) location.hash = "#crud";
  setStatusBadge("Iniciando...", "secondary");

  await window.__reload();
  route();
})();