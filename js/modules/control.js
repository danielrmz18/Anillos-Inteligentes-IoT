import { store } from "../store.js";
import { updateRing } from "../api.js";
import { escapeHtml, parseBoolean, clampBattery, nowIso, formatDate, avatarFallback } from "../utils.js";

export function renderControl(){
  const el = document.getElementById("view-control");

  el.innerHTML = `
    <section class="row g-3" id="controlGrid"></section>
    <div id="controlEmpty" class="p-5 text-center d-none">
      <div class="h5 mb-2">Sin anillos</div>
      <div class="text-secondary">Crea registros en CRUD para controlarlos aquí.</div>
    </div>
  `;

  paintControl();
}

function filtered(){
  const q = (store.globalSearch || "").toLowerCase().trim();
  const st = store.globalEstado;

  let items = [...store.rings];

  if(st !== ""){
    items = items.filter(r => String(parseBoolean(r.Estado)) === st);
  }
  if(q){
    items = items.filter(r => [r.id, r.Nombre, r.Modelo, r.Ip].join(" ").toLowerCase().includes(q));
  }

  return items;
}

function statusBadge(active){
  return active
    ? `<span class="badge rounded-pill text-bg-success">Activo</span>`
    : `<span class="badge rounded-pill text-bg-secondary">Inactivo</span>`;
}

function batteryWidget(b){
  const bat = clampBattery(b);
  return `
    <div class="d-flex align-items-center gap-2">
      <div class="battery-bar flex-grow-1">
        <div class="battery-fill" style="width:${bat}%;"></div>
      </div>
      <span class="small">${bat}%</span>
    </div>
  `;
}

function paintControl(){
  const grid = document.getElementById("controlGrid");
  const empty = document.getElementById("controlEmpty");
  const items = filtered();

  empty.classList.toggle("d-none", items.length !== 0);

  grid.innerHTML = items.map(r=>{
    const id = escapeHtml(r.id);
    const nombre = escapeHtml(r.Nombre || `Ring ${id}`);
    const modelo = escapeHtml(r.Modelo || "—");
    const ip = escapeHtml(r.Ip || "—");
    const active = parseBoolean(r.Estado);
    const last = escapeHtml(formatDate(r.UltimaSincronizacion));
    const avatar = escapeHtml(r.Usuario || avatarFallback(r.Nombre, r.Modelo));

    return `
      <div class="col-12 col-lg-6">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body p-4">
            <div class="d-flex justify-content-between align-items-start gap-3">
              <div class="d-flex align-items-center gap-2">
                <img class="avatar" src="${avatar}" onerror="this.src='${avatarFallback("ring","model")}'" alt="avatar">
                <div>
                  <div class="d-flex align-items-center gap-2">
                    <span class="badge text-bg-dark">#${id}</span>
                    <div class="fw-semibold">${nombre}</div>
                  </div>
                  <div class="small text-secondary-emphasis">${modelo}</div>
                </div>
              </div>

              <div class="text-end">
                ${statusBadge(active)}
                <div class="small text-secondary-emphasis mt-2"><i class="bi bi-router"></i> ${ip}</div>
              </div>
            </div>

            <hr class="my-3">

            <div class="d-flex justify-content-between align-items-center">
              <div>
                <div class="small text-secondary-emphasis">Batería</div>
                ${batteryWidget(r.Bateria)}
              </div>
              <div class="text-end">
                <div class="small text-secondary-emphasis">Última sync</div>
                <div class="fw-semibold">${last}</div>
              </div>
            </div>

            <hr class="my-3">

            <div class="fw-semibold mb-2">Interruptores de control</div>

            <div class="d-flex flex-wrap gap-2 align-items-center">
              <div class="form-check form-switch m-0">
                <input class="form-check-input" type="checkbox"
                  data-act="toggle" data-id="${id}" ${active ? "checked" : ""}>
                <label class="form-check-label">Encendido</label>
              </div>

              <button class="btn btn-sm btn-outline-secondary" data-act="sync" data-id="${id}">
                <i class="bi bi-arrow-repeat"></i> Sincronizar
              </button>

              <button class="btn btn-sm btn-outline-secondary" data-act="bminus" data-id="${id}">-10% batería</button>
              <button class="btn btn-sm btn-outline-secondary" data-act="bplus" data-id="${id}">+10% batería</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");

  bindControlEvents();
}

function bindControlEvents(){
  const grid = document.getElementById("controlGrid");
  grid.onclick = async (e)=>{
    const btn = e.target.closest("[data-act]");
    if(!btn) return;

    const id = btn.dataset.id;
    const act = btn.dataset.act;
    const ring = store.rings.find(x => String(x.id) === String(id));
    if(!ring) return;

    if(act === "sync"){
      await updateRing(id, { ...ring, UltimaSincronizacion: nowIso() });
      window.__toast("Sincronizado ✅");
      window.__reload();
      return;
    }

    if(act === "bminus" || act === "bplus"){
      const cur = clampBattery(ring.Bateria);
      const next = act === "bminus" ? cur - 10 : cur + 10;
      await updateRing(id, { ...ring, Bateria: clampBattery(next), UltimaSincronizacion: nowIso() });
      window.__toast("Batería actualizada ✅");
      window.__reload();
    }
  };

  grid.onchange = async (e)=>{
    const sw = e.target.closest("input[data-act='toggle']");
    if(!sw) return;

    const id = sw.dataset.id;
    const ring = store.rings.find(x => String(x.id) === String(id));
    if(!ring) return;

    const checked = sw.checked;
    await updateRing(id, { ...ring, Estado: checked, UltimaSincronizacion: nowIso() });
    window.__toast(`Estado: ${checked ? "Activo" : "Inactivo"} ✅`);
    window.__reload();
  };
}

export function refreshControl(){ paintControl(); }