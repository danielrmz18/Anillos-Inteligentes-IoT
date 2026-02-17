export function escapeHtml(str){
  return String(str ?? "")
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");
}

export function nowIso(){ return new Date().toISOString(); }

export function formatDate(val){
  if(!val) return "—";
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? String(val) : d.toLocaleString();
}

export function parseBoolean(val){
  if (typeof val === "boolean") return val;
  if (typeof val === "string") return val.toLowerCase() === "true";
  if (typeof val === "number") return val === 1;
  return false;
}

export function clampBattery(n){
  const x = Number(n);
  if (Number.isNaN(x)) return 0;
  return Math.max(0, Math.min(100, Math.round(x)));
}

export function randomLocalIpLike(){
  const a = 192, b = 168;
  const c = Math.floor(Math.random() * 255);
  const d = Math.floor(Math.random() * 255);
  return `${a}.${b}.${c}.${d}`;
}

export function avatarFallback(nombre, modelo){
  const seed = encodeURIComponent(`${nombre || "ring"}-${modelo || "model"}`);
  return `https://api.dicebear.com/7.x/thumbs/png?seed=${seed}`;
}