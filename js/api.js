import { API_BASE } from "./config.js";

async function apiRequest(url, options = {}){
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  if(!res.ok){
    const text = await res.text().catch(()=> "");
    throw new Error(`HTTP ${res.status} - ${text || res.statusText}`);
  }

  return await res.json().catch(()=> null);
}

export async function getAllRings(){
  const data = await apiRequest(API_BASE, { method: "GET" });
  return Array.isArray(data) ? data : [];
}

export async function createRing(payload){
  return await apiRequest(API_BASE, { method:"POST", body: JSON.stringify(payload) });
}

export async function updateRing(id, payload){
  return await apiRequest(`${API_BASE}/${id}`, { method:"PUT", body: JSON.stringify(payload) });
}

export async function deleteRing(id){
  return await apiRequest(`${API_BASE}/${id}`, { method:"DELETE" });
}