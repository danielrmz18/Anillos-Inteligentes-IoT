import { store } from "../store.js";
import { createRing, updateRing, deleteRing } from "../api.js";
import { escapeHtml, formatDate, parseBoolean, clampBattery, nowIso, randomLocalIpLike, avatarFallback } from "../utils.js";

export function renderCrud(){
  const el = document.getElementById("view-crud");

  el.innerHTML = `
    <section class="card border-0 shadow-sm">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th class="ps-3">ID</th>
                <th>Anillo</th>
                <th>Estado</th>
                <th>Batería</th>
                <th>Última sincronización</th>
                <th>IP</th>
                <th class="text-end pe-3">Acciones</th>
              </tr>
            </thead>
            <tbody id="crudBody"></tbody>
          </table>
        </div>
      </div>
    </section>

    <div class="mt-3 d-flex gap-2">
      <button class="btn btn-light btn-sm" id="crudNew"><i class="bi bi-plus-lg"></i> Nuevo</button>
      <button class="btn btn-outline-danger btn-sm" id="crudDeleteAll"><i class="bi bi-trash3"></i> Borrar todo</button>
      <button class="btn btn-outline-secondary btn-sm" id="crudSeed"><i class="bi bi-stars"></i> Crear ejemplo</button>
    </div>
  `;

  paintTable();
  bindCrudEvents();
}

function filteredRings(){
  const q = (store.globalSearch || "").toLowerCase().trim();
  const st = store.globalEstado;

  let items = [...store.rings];

  if(st !== ""){
    items = items.filter(r => String(parseBoolean(r.Estado)) === st);
  }

  if(q){
    items = items.filter(r=>{
      const hay = [r.id, r.Nombre, r.Modelo, r.Ip].join(" ").toLowerCase();
      return hay.includes(q);
    });
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
    <div class="d-flex align-items-center gap-2" style="min-width:170px">
      <div class="battery-bar flex-grow-1">
        <div class="battery-fill" style="width:${bat}%;"></div>
      </div>
      <span class="small">${bat}%</span>
    </div>
  `;
}

function paintTable(){
  const body = document.getElementById("crudBody");
  if(!body) return;

  const items = filteredRings();
  body.innerHTML = items.map(r=>{
    const id = escapeHtml(r.id);
    const nombre = escapeHtml(r.Nombre || `Ring ${id}`);
    const modelo = escapeHtml(r.Modelo || "—");
    const ip = escapeHtml(r.Ip || "—");
    const active = parseBoolean(r.Estado);
    const last = escapeHtml(formatDate(r.UltimaSincronizacion));

    const avatar = escapeHtml(r.Usuario || avatarFallback(r.Nombre, r.Modelo));

    return `
      <tr>
        <td class="ps-3"><span class="badge text-bg-dark">${id}</span></td>
        <td>
          <div class="d-flex align-items-center gap-2">
            <img class="avatar" src="${avatar}" onerror="this.src='${avatarFallback("ring","model")}'" alt="avatar">
            <div>
              <div class="fw-semibold">${nombre}</div>
              <div class="small text-secondary-emphasis">${modelo}</div>
            </div>
          </div>
        </td>
        <td>${statusBadge(active)}</td>
        <td>${batteryWidget(r.Bateria)}</td>
        <td>${last}</td>
        <td>${ip}</td>
        <td class="text-end pe-3">
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-secondary" data-act="edit" data-id="${id}">
              <i class="bi bi-pencil-square"></i>
            </button>
            <button class="btn btn-outline-danger" data-act="del" data-id="${id}">
              <i class="bi bi-trash3"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function bindCrudEvents(){
  // botones
  document.getElementById("crudNew").addEventListener("click", openCreate);
  document.getElementById("crudSeed").addEventListener("click", seedOne);
  document.getElementById("crudDeleteAll").addEventListener("click", deleteAll);

  // tabla
  document.getElementById("crudBody").addEventListener("click", async (e)=>{
    const btn = e.target.closest("button[data-act]");
    if(!btn) return;

    const id = btn.dataset.id;
    const act = btn.dataset.act;
    const ring = store.rings.find(x => String(x.id) === String(id));
    if(!ring) return;

    if(act === "edit") openEdit(ring);
    if(act === "del") await delOne(id);
  });

  // modal
  const form = document.getElementById("ringForm");
  form.addEventListener("submit", onSubmitModal);
}

function openCreate(){
  window.__modalMode = "create";
  document.getElementById("modalTitle").textContent = "Nuevo anillo";
  fillModalFields({
    id: "",
    Nombre: "",
    Modelo: "",
    Usuario: "",
    Estado: true,
    Bateria: 85,
    UltimaSincronizacion: "",
    Ip: ""
  });
  new bootstrap.Modal(document.getElementById("ringModal")).show();
}

function openEdit(ring){
  window.__modalMode = "edit";
  document.getElementById("modalTitle").textContent = `Editar anillo #${ring.id}`;
  fillModalFields(ring);
  new bootstrap.Modal(document.getElementById("ringModal")).show();
}

function fillModalFields(r){
  document.getElementById("ringId").value = r.id ?? "";
  document.getElementById("Nombre").value = r.Nombre ?? "";
  document.getElementById("Modelo").value = r.Modelo ?? "";
  document.getElementById("Usuario").value = r.Usuario ?? "";
  document.getElementById("Estado").value = String(parseBoolean(r.Estado));
  document.getElementById("Bateria").value = String(clampBattery(r.Bateria ?? 0));
  document.getElementById("UltimaSincronizacion").value = r.UltimaSincronizacion ?? "";
  document.getElementById("Ip").value = r.Ip ?? "";
}

function buildPayloadFromModal(){
  const nombre = document.getElementById("Nombre").value.trim();
  const modelo = document.getElementById("Modelo").value.trim();
  const usuario = document.getElementById("Usuario").value.trim();
  const estado = document.getElementById("Estado").value;
  const bateria = document.getElementById("Bateria").value;
  const last = document.getElementById("UltimaSincronizacion").value.trim();
  const ip = document.getElementById("Ip").value.trim();

  if(!nombre) throw new Error("Nombre es obligatorio.");
  if(!modelo) throw new Error("Modelo es obligatorio.");

  return {
    Nombre: nombre,
    Modelo: modelo,
    Usuario: usuario || avatarFallback(nombre, modelo),
    Estado: parseBoolean(estado),
    Bateria: clampBattery(bateria),
    UltimaSincronizacion: last || nowIso(),
    Ip: ip || randomLocalIpLike(),
  };
}

async function onSubmitModal(e){
  e.preventDefault();

  const toast = window.__toast;
  try{
    const payload = buildPayloadFromModal();

    if(window.__modalMode === "create"){
      await createRing(payload);
      toast("Creado ✅");
    }else{
      const id = document.getElementById("ringId").value;
      await updateRing(id, payload);
      toast("Actualizado ✅");
    }

    bootstrap.Modal.getInstance(document.getElementById("ringModal")).hide();
    window.__reload(); // recarga global
  }catch(err){
    toast(err.message || "Error al guardar ❌");
  }
}

async function delOne(id){
  if(!confirm(`¿Eliminar anillo #${id}?`)) return;
  await deleteRing(id);
  window.__toast("Eliminado ✅");
  window.__reload();
}

async function seedOne(){
  const code = Math.floor(Math.random() * 900 + 100);
  const payload = {
    Nombre: `Ring-${code}`,
    Modelo: `SR-${Math.floor(Math.random() * 900 + 100)}`,
    Usuario: avatarFallback(`Ring-${code}`, "SR"),
    Estado: Math.random() > 0.3,
    Bateria: Math.floor(Math.random() * 101),
    UltimaSincronizacion: nowIso(),
    Ip: randomLocalIpLike(),
  };
  await createRing(payload);
  window.__toast("Ejemplo creado ⭐");
  window.__reload();
}

async function deleteAll(){
  if(!confirm("¿Borrar TODOS los registros?")) return;
  for(const r of store.rings){
    await deleteRing(r.id);
  }
  window.__toast("Todo eliminado 🗑️");
  window.__reload();
}

// API para re-render cuando cambia global search/filtro
export function refreshCrud(){ paintTable(); }