import { store } from "../store.js";
import { REFRESH_MS } from "../config.js";
import { parseBoolean, clampBattery, nowIso, escapeHtml } from "../utils.js";

let timer = null;
let chartsById = new Map();
let isRunning = true;

export function renderMonitor(){
  const el = document.getElementById("view-monitor");

  el.innerHTML = `
    <section class="card border-0 shadow-sm mb-3">
      <div class="card-body p-4 d-flex flex-wrap gap-2 align-items-center justify-content-between">
        <div>
          <div class="fw-semibold">Monitoreo</div>
          <div class="text-secondary">Historial local (últimos 10) + gráficas + refresh cada ${REFRESH_MS/1000}s.</div>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-light btn-sm" id="monToggle">
            <i class="bi bi-pause-fill"></i> Refresco ON
          </button>
          <button class="btn btn-outline-danger btn-sm" id="monClearHist">
            <i class="bi bi-trash3"></i> Limpiar historial local
          </button>
        </div>
      </div>
    </section>

    <section class="row g-3" id="monCharts"></section>

    <section class="card border-0 shadow-sm mt-3">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th class="ps-3">Anillo</th>
                <th>IP</th>
                <th>Últimos 10 eventos</th>
              </tr>
            </thead>
            <tbody id="monBody"></tbody>
          </table>
        </div>
      </div>
    </section>
  `;

  bindMonitorEvents();
  paintMonitor();
  start();
}

function historyKey(id){ return `ring_history_${id}`; }

function loadHistory(id){
  try{
    const raw = localStorage.getItem(historyKey(id));
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  }catch{ return []; }
}

function saveHistory(id, arr){
  localStorage.setItem(historyKey(id), JSON.stringify(arr.slice(0,10)));
}

function pushEventIfChanged(ring){
  const id = String(ring.id);
  const ev = {
    t: ring.UltimaSincronizacion || nowIso(),
    Estado: parseBoolean(ring.Estado),
    Bateria: clampBattery(ring.Bateria),
  };

  const hist = loadHistory(id);
  const last = hist[0];

  if(!last || last.t !== ev.t || last.Estado !== ev.Estado || last.Bateria !== ev.Bateria){
    hist.unshift(ev);
    saveHistory(id, hist);
  }

  return loadHistory(id);
}

function filtered(){
  const q = (store.globalSearch || "").toLowerCase().trim();
  const st = store.globalEstado;

  let items = [...store.rings];
  if(st !== "") items = items.filter(r => String(parseBoolean(r.Estado)) === st);
  if(q) items = items.filter(r => [r.id, r.Nombre, r.Modelo, r.Ip].join(" ").toLowerCase().includes(q));
  return items;
}

function ensureChartCard(ring){
  const id = String(ring.id);
  const canvasId = `chart_${id}`;
  const wrap = document.getElementById("monCharts");

  if(document.getElementById(canvasId)) return canvasId;

  const name = escapeHtml(ring.Nombre || `Ring ${id}`);
  const model = escapeHtml(ring.Modelo || "—");
  const ip = escapeHtml(ring.Ip || "—");

  const col = document.createElement("div");
  col.className = "col-12 col-lg-6";
  col.innerHTML = `
    <div class="card chart-card border-0 shadow-sm">
      <div class="card-body p-4 h-100 d-flex flex-column">
        <div class="d-flex justify-content-between align-items-start gap-2">
          <div>
            <div class="d-flex align-items-center gap-2">
              <span class="badge text-bg-dark">#${escapeHtml(id)}</span>
              <div class="fw-semibold">${name}</div>
            </div>
            <div class="small text-secondary-emphasis mt-1">${model} · IP: ${ip}</div>
          </div>
          <div class="small text-secondary-emphasis">Batería + Estado</div>
        </div>
        <div class="flex-grow-1 mt-3">
          <canvas id="${canvasId}"></canvas>
        </div>
      </div>
    </div>
  `;
  wrap.appendChild(col);
  return canvasId;
}

function buildOrUpdateChart(ring, history){
  const id = String(ring.id);
  const canvasId = ensureChartCard(ring);
  const ctx = document.getElementById(canvasId);

  const seq = history.slice().reverse();
  const labels = seq.map(h=>{
    const d = new Date(h.t);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleTimeString();
  });

  const battery = seq.map(h => h.Bateria);
  const status01 = seq.map(h => h.Estado ? 1 : 0);

  if(!chartsById.has(id)){
    const ch = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
            {
    label: "Batería (%)",
    data: battery,
    tension: 0.35,
    pointRadius: 3,
    yAxisID: "yBattery"
         },
            {
    label: "Estado (1=Activo)",
    data: status01,
    tension: 0.35,
    pointRadius: 3,
    yAxisID: "yStatus"
             },
]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
  yBattery: {
    type: "linear",
    position: "left",
    min: 0,
    max: 100,
  },
  yStatus: {
    type: "linear",
    position: "right",
    min: 0,
    max: 1,
    ticks: {
      stepSize: 1
    }
  }
}
      }
    });
    chartsById.set(id, ch);
  } else {
    const ch = chartsById.get(id);
    ch.data.labels = labels;
    ch.data.datasets[0].data = battery;
    ch.data.datasets[1].data = status01;
    ch.update();
  }
}

function paintMonitor(){
  const items = filtered();

  // charts
  chartsById.forEach(ch => ch.destroy());
  chartsById.clear();
  document.getElementById("monCharts").innerHTML = "";

  for(const r of items){
    const hist = pushEventIfChanged(r);
    buildOrUpdateChart(r, hist);
  }

  // table
  const body = document.getElementById("monBody");
  body.innerHTML = items.map(r=>{
    const id = String(r.id);
    const name = escapeHtml(r.Nombre || `Ring ${id}`);
    const ip = escapeHtml(r.Ip || "—");
    const hist = loadHistory(id);

    const pills = hist.map(h=>{
      const s = h.Estado ? "Activo" : "Inactivo";
      const label = `${s} · ${h.Bateria}%`;
      return `<span class="status-pill" title="${escapeHtml(h.t)}">${escapeHtml(label)}</span>`;
    }).join("");

    return `
      <tr>
        <td class="ps-3">
          <div class="fw-semibold">${name}</div>
          <div class="small text-secondary-emphasis">#${escapeHtml(id)} · ${escapeHtml(r.Modelo || "")}</div>
        </td>
        <td>${ip}</td>
        <td>${pills || '<span class="text-secondary-emphasis">Sin historial aún</span>'}</td>
      </tr>
    `;
  }).join("");
}

function bindMonitorEvents(){
  document.getElementById("view-monitor").addEventListener("click", (e)=>{
    const t = e.target.closest("button");
    if(!t) return;

    if(t.id === "monToggle"){
      if(isRunning) stop();
      else start();
    }

    if(t.id === "monClearHist"){
      if(!confirm("¿Borrar historial local de todos los anillos?")) return;
      for(const r of store.rings){
        localStorage.removeItem(historyKey(String(r.id)));
      }
      window.__toast("Historial borrado 🧹");
      paintMonitor();
    }
  });
}

function start(){
  stop();
  isRunning = true;
  const btn = document.getElementById("monToggle");
  if(btn) btn.innerHTML = `<i class="bi bi-pause-fill"></i> Refresco ON`;
  timer = setInterval(paintMonitor, REFRESH_MS);
}

function stop(){
  isRunning = false;
  const btn = document.getElementById("monToggle");
  if(btn) btn.innerHTML = `<i class="bi bi-play-fill"></i> Refresco OFF`;
  if(timer) clearInterval(timer);
  timer = null;
}

export function refreshMonitor(){
  paintMonitor();
}