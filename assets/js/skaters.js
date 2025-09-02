"use strict";

(function(){
  const { qs, qsa, on, debounce, showToast, getJSONCached } = window.RP;

  const state = {
    data: [],
    filtered: [],
    page: 1,
    perPage: 9,
    filters: { text: "", ciudad: "", disciplina: "", nivel: "", orden: "popularidad" }
  };

  function applyFilters() {
    const { text, ciudad, disciplina, nivel, orden } = state.filters;
    let arr = [...state.data];
    if (text) {
      const t = text.toLowerCase();
      arr = arr.filter(s => (s.nombre + " " + s.ciudad + " " + s.bioCorta).toLowerCase().includes(t));
    }
    if (ciudad) arr = arr.filter(s => s.ciudad === ciudad);
    if (disciplina) arr = arr.filter(s => s.disciplinas?.includes(disciplina));
    if (nivel) arr = arr.filter(s => s.nivel === nivel);
    if (orden === "nivel") {
      const order = { principiante: 0, intermedio: 1, avanzado: 2 };
      arr.sort((a,b)=> (order[b.nivel]||0) - (order[a.nivel]||0));
    } else if (orden === "recientes") {
      arr.sort((a,b)=> (b.id||0) - (a.id||0));
    } else { // popularidad (simulada con destacado true primero)
      arr.sort((a,b)=> (b.destacado?1:0) - (a.destacado?1:0));
    }
    state.filtered = arr;
    state.page = 1;
    renderChips();
    renderList();
    if (arr.length === 0) showToast("No se encontraron resultados");
  }

  function renderChips() {
    const box = qs("#chips");
    if (!box) return;
    box.innerHTML = "";
    const entries = [
      ["Texto", state.filters.text],
      ["Ciudad", state.filters.ciudad],
      ["Disciplina", state.filters.disciplina],
      ["Nivel", state.filters.nivel]
    ].filter(([,v])=> v);
    entries.forEach(([label,val])=>{
      const b = document.createElement("button");
      b.className = "chip";
      b.innerHTML = `${label}: ${val} <i class="ri-close-line"></i>`;
      on(b, "click", ()=>{
        if (label === "Texto") state.filters.text = "";
        if (label === "Ciudad") state.filters.ciudad = "";
        if (label === "Disciplina") state.filters.disciplina = "";
        if (label === "Nivel") state.filters.nivel = "";
        syncInputs();
        applyFilters();
      });
      box.appendChild(b);
    });
  }

  function paginate(arr) {
    const start = (state.page - 1) * state.perPage;
    return arr.slice(start, start + state.perPage);
  }

  function renderList() {
    const cont = qs("#skaters-list");
    if (!cont) return;
    const pageItems = paginate(state.filtered);
    cont.innerHTML = pageItems.map(cardSkater).join("");
    // paginación
    const totalPages = Math.max(1, Math.ceil(state.filtered.length / state.perPage));
    qs("#page-info").textContent = `${state.page} / ${totalPages}`;
    qs("#prev-page").disabled = state.page <= 1;
    qs("#next-page").disabled = state.page >= totalPages;

    // binds modal
    qsa("[data-profile]").forEach((btn)=> on(btn, "click", ()=> openModal(+btn.dataset.id)));
  }

  function cardSkater(s) {
    const chips = (s.disciplinas||[]).map(d=>`<span class="chip">${d}</span>`).join(" ");
    const badge = s.destacado ? `<span class="badge">Destacado</span>` : "";
    return `
      <article class="card">
        <div class="stack">
          <img src="${s.foto}" alt="${s.nombre}" loading="lazy" style="border-radius:12px; aspect-ratio: 16/9; object-fit: cover;" />
          <div class="between">
            <h3>${s.nombre}</h3>
            ${badge}
          </div>
          <p class="muted">${s.ciudad} • ${s.nivel}</p>
          <div class="chips">${chips}</div>
          <p>${s.bioCorta}</p>
          <div class="between">
            <div class="flex">
              ${s.redes?.instagram ? `<a class="icon-link" href="${s.redes.instagram}" aria-label="Instagram"><i class="ri-instagram-line"></i></a>` : ""}
              ${s.redes?.tiktok ? `<a class="icon-link" href="${s.redes.tiktok}" aria-label="TikTok"><i class="ri-tiktok-line"></i></a>` : ""}
            </div>
            <button class="btn" data-profile data-id="${s.id}"><i class="ri-user-line"></i> Ver perfil</button>
          </div>
        </div>
      </article>`;
  }

  function openModal(id) {
    const s = state.data.find(x=> x.id === id);
    if (!s) return;
    const modal = qs("#modal-skaters");
    const body = qs(".modal-body", modal);
    body.innerHTML = `
      <header class="between">
        <h2 id="modal-title">${s.nombre}</h2>
        <span class="badge">${s.nivel}</span>
      </header>
      <div class="grid two mt-3">
        <img src="${s.foto}" alt="${s.nombre}" style="border-radius:12px; width:100%; object-fit:cover;" />
        <div>
          <p class="muted">${s.ciudad}</p>
          <p>${s.bioCorta} Lorem ipsum dolor sit amet, info de ejemplo.</p>
          <div class="chips">${(s.disciplinas||[]).map(d=>`<span class=\"chip\">${d}</span>`).join(" ")}</div>
        </div>
      </div>
    `;
    modal.setAttribute("aria-hidden", "false");
    const close = qs(".modal-close", modal);
    on(close, "click", ()=> modal.setAttribute("aria-hidden", "true"));
    on(modal, "click", (e)=> { if (e.target === modal) modal.setAttribute("aria-hidden", "true"); });
    on(document, "keydown", (e)=> { if (e.key === "Escape") modal.setAttribute("aria-hidden", "true"); });
  }

  function syncInputs() {
    qs("#f-text").value = state.filters.text;
    qs("#f-ciudad").value = state.filters.ciudad;
    qs("#f-disciplina").value = state.filters.disciplina;
    qs("#f-nivel").value = state.filters.nivel;
    qs("#f-orden").value = state.filters.orden;
  }

  async function init() {
    const data = await getJSONCached("data/skaters.json");
    state.data = data;
    // llenar selects únicas
    const ciudades = Array.from(new Set(data.map(s=> s.ciudad))).sort();
    const selC = qs("#f-ciudad");
    selC.innerHTML = '<option value="">Todas</option>' + ciudades.map(c=>`<option value="${c}">${c}</option>`).join("");
    // bind filtros
    on(qs("#f-text"), "input", debounce((e)=>{ state.filters.text = e.target.value.trim(); }, 250));
    on(qs("#f-ciudad"), "change", (e)=>{ state.filters.ciudad = e.target.value; });
    on(qs("#f-disciplina"), "change", (e)=>{ state.filters.disciplina = e.target.value; });
    on(qs("#f-nivel"), "change", (e)=>{ state.filters.nivel = e.target.value; });
    on(qs("#f-orden"), "change", (e)=>{ state.filters.orden = e.target.value; });
    on(qs("#btn-aplicar"), "click", ()=> applyFilters());
    on(qs("#prev-page"), "click", ()=> { state.page = Math.max(1, state.page - 1); renderList(); });
    on(qs("#next-page"), "click", ()=> { const totalPages = Math.ceil(state.filtered.length / state.perPage)||1; state.page = Math.min(totalPages, state.page + 1); renderList(); });
    // inicial
    state.filtered = data;
    renderList();
  }

  document.addEventListener("DOMContentLoaded", () => { init().catch(()=> showToast("No se pudieron cargar patinadores")); });
})();
