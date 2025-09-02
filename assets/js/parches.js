"use strict";

(function(){
  const { qs, on, debounce, showToast, getJSONCached } = window.RP;
  const state = { data: [], filtered: [], filters: { text: "", ciudad: "", disciplina: "" } };

  function applyFilters(){
    const { text, ciudad, disciplina } = state.filters;
    let arr = [...state.data];
    if (text){ const t = text.toLowerCase(); arr = arr.filter(p => (p.nombre+" "+p.ciudad+" "+p.descripcion).toLowerCase().includes(t)); }
    if (ciudad) arr = arr.filter(p => p.ciudad === ciudad);
    if (disciplina) arr = arr.filter(p => p.disciplinas?.includes(disciplina));
    state.filtered = arr;
    renderList();
    if (arr.length === 0) showToast("No se encontraron resultados");
  }

  function cardParche(p){
    const chips = (p.disciplinas||[]).map(d=>`<span class="chip">${d}</span>`).join(" ");
    return `
      <article class="card">
        <div class="stack">
          <img src="${p.foto}" alt="${p.nombre}" loading="lazy" style="border-radius:12px; aspect-ratio: 16/9; object-fit: cover;" />
          <div class="between">
            <h3>${p.nombre}</h3>
            <span class="muted">${p.ciudad}</span>
          </div>
          <div class="chips">${chips}</div>
          <p>${p.descripcion}</p>
          <div class="between">
            <span class="muted">Miembros aprox: ${p.miembrosAprox || 0}</span>
            <div class="flex">
              <button class="btn" data-detalle data-id="${p.id}"><i class="ri-information-line"></i> Ver detalle</button>
              <a class="btn ghost" href="spots.html#ciudad=${encodeURIComponent(p.ciudad)}"><i class="ri-map-pin-line"></i> Ver spots cercanos</a>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  function renderList(){
    const cont = qs("#parches-list");
    cont.innerHTML = state.filtered.map(cardParche).join("");
    cont.querySelectorAll("[data-detalle]").forEach(btn => on(btn, "click", ()=> openModal(+btn.dataset.id)));
  }

  function openModal(id){
    const p = state.data.find(x=> x.id === id);
    if (!p) return;
    const modal = qs("#modal-parche");
    const body = modal.querySelector(".modal-body");
    body.innerHTML = `
      <header class="between">
        <h2 id="modal-title-parche">${p.nombre}</h2>
        <a class="btn ghost" href="spots.html#ciudad=${encodeURIComponent(p.ciudad)}"><i class=\"ri-map-pin-line\"></i> Ver spots cercanos</a>
      </header>
      <div class="grid two mt-3">
        <img src="${p.foto}" alt="${p.nombre}" style="border-radius:12px; width:100%; object-fit:cover;" />
        <div>
          <p class="muted">${p.ciudad}</p>
          <p>${p.descripcion} Texto de ejemplo extendido.</p>
          <div class="chips">${(p.disciplinas||[]).map(d=>`<span class=\"chip\">${d}</span>`).join(" ")}</div>
          <p class="mt-3">Contacto: ${p.contacto?.correo || "correo@ejemplo.com"}</p>
        </div>
      </div>
    `;
    modal.setAttribute("aria-hidden", "false");
    const close = modal.querySelector(".modal-close");
    on(close, "click", ()=> modal.setAttribute("aria-hidden", "true"));
    on(modal, "click", (e)=> { if (e.target === modal) modal.setAttribute("aria-hidden", "true"); });
    on(document, "keydown", (e)=> { if (e.key === "Escape") modal.setAttribute("aria-hidden", "true"); });
  }

  async function init(){
    const data = await getJSONCached("data/parches.json");
    state.data = data;
    state.filtered = data;
    // selects
    const ciudades = Array.from(new Set(data.map(p=> p.ciudad))).sort();
    const selC = qs("#p-ciudad");
    selC.innerHTML = '<option value="">Todas</option>' + ciudades.map(c=>`<option value="${c}">${c}</option>`).join("");
    // binds
    on(qs("#p-text"), "input", debounce((e)=>{ state.filters.text = e.target.value.trim(); }, 250));
    on(qs("#p-ciudad"), "change", (e)=>{ state.filters.ciudad = e.target.value; });
    on(qs("#p-disciplina"), "change", (e)=>{ state.filters.disciplina = e.target.value; });
    on(qs("#p-aplicar"), "click", ()=> applyFilters());
    renderList();
  }

  document.addEventListener("DOMContentLoaded", ()=> { init().catch(()=> showToast("No se pudieron cargar los parches")); });
})();
