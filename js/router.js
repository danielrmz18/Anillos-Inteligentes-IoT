const views = {
  crud: document.getElementById("view-crud"),
  control: document.getElementById("view-control"),
  monitor: document.getElementById("view-monitor"),
};

export function showView(name){
  Object.entries(views).forEach(([k, el]) => {
    el.classList.toggle("d-none", k !== name);
  });

  // activar botoncitos nav
  document.querySelectorAll("[data-nav]").forEach(a => {
    const isActive = a.getAttribute("data-nav") === name;
    a.classList.toggle("btn-light", isActive);
    a.classList.toggle("btn-outline-light", !isActive);
  });
}

export function currentViewFromHash(){
  const h = (location.hash || "#crud").replace("#","").trim();
  if(!["crud","control","monitor"].includes(h)) return "crud";
  return h;
}