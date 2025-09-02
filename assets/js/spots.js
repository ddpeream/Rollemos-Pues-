"use strict";

(function(){
  const { qs, on, debounce, showToast, getJSONCached } = window.RP;
  const state = { data: [], filtered: [], mapLoaded: false, map: null, markers: {}, filters: { ciudad: "", tipo: "", dificultad: "" } };

  function applyFilters(){
    const { ciudad, tipo, dificultad } = state.filters;
    let arr = [...state.data];
    if (ciudad) arr = arr.filter(s=> s.ciudad === ciudad);
    if (tipo) arr = arr.filter(s=> s.tipo === tipo);
    if (dificultad) arr = arr.filter(s=> s.dificultad === dificultad);
    state.filtered = arr;
    renderList();
    if (state.mapLoaded) refreshMarkers();
    if (arr.length === 0) showToast("No se encontraron resultados");
  }

  function cardSpot(s){
    return `
      <article class="card">
        <div class="stack">
          <img src="${s.foto}" alt="${s.nombre}" loading="lazy" style="border-radius:12px; aspect-ratio: 16/9; object-fit: cover;" />
          <div class="between">
            <h3>${s.nombre}</h3>
            <span class="badge">${s.dificultad}</span>
          </div>
          <p class="muted">${s.ciudad} • ${s.tipo}</p>
          <p>${s.descripcion}</p>
          <div class="between">
            <span></span>
            <button class="btn" data-center data-id="${s.id}"><i class="ri-compass-3-line"></i> Ver en mapa</button>
          </div>
        </div>
      </article>
    `;
  }

  function renderList(){
    const cont = qs("#spots-list");
    cont.innerHTML = state.filtered.map(cardSpot).join("");
    cont.querySelectorAll("[data-center]").forEach(btn => on(btn, "click", ()=> centerOn(+btn.dataset.id)));
  }

  async function loadLeaflet(){
    if (state.mapLoaded) return true;
    // Cargar CSS y JS desde CDN
    await new Promise((resolve)=>{
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.onload = resolve; document.head.appendChild(link);
    });
    await new Promise((resolve)=>{
      const s = document.createElement("script");
      s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      s.onload = resolve; document.body.appendChild(s);
    });
    state.mapLoaded = true;
    return true;
  }

  async function ensureMap(){
    if (!state.mapLoaded) await loadLeaflet();
    if (!state.map){
      const mapEl = qs("#map");
      // Medellín centro
      state.map = L.map(mapEl).setView([6.2442, -75.5812], 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap" }).addTo(state.map);
      refreshMarkers();
  mapEl.setAttribute("aria-busy", "false");
    }
  }

  function refreshMarkers(){
    // Limpiar
    Object.values(state.markers).forEach(m => state.map.removeLayer(m));
    state.markers = {};
    state.filtered.forEach(s => {
      const m = L.marker([s.lat, s.lng]).addTo(state.map).bindPopup(`<strong>${s.nombre}</strong><br/>${s.ciudad} • ${s.tipo}`);
      state.markers[s.id] = m;
    });
  }

  async function centerOn(id){
    const s = state.data.find(x=> x.id === id);
    if (!s) return;
    await ensureMap();
    state.map.setView([s.lat, s.lng], 15);
    state.markers[id]?.openPopup();
  }

  async function init(){
    const data = await getJSONCached("data/spots.json");
    state.data = data; state.filtered = data;
    // selects
    const ciudades = Array.from(new Set(data.map(s=> s.ciudad))).sort();
    qs("#s-ciudad").innerHTML = '<option value="">Todas</option>' + ciudades.map(c=>`<option value="${c}">${c}</option>`).join("");
    // deep link por ciudad
    const hashParams = new URLSearchParams(location.hash.replace(/^#/, ""));
    const ciudadHash = hashParams.get("ciudad");
    if (ciudadHash){ state.filters.ciudad = ciudadHash; }
    // binds
    on(qs("#s-ciudad"), "change", (e)=>{ state.filters.ciudad = e.target.value; });
    on(qs("#s-tipo"), "change", (e)=>{ state.filters.tipo = e.target.value; });
    on(qs("#s-dificultad"), "change", (e)=>{ state.filters.dificultad = e.target.value; });
    on(qs("#s-aplicar"), "click", ()=> applyFilters());
    on(qs("#btn-open-map"), "click", ()=> ensureMap());
    // Carga al hacer scroll
    const mapEl = qs("#map");
    if ("IntersectionObserver" in window && mapEl){
      const io = new IntersectionObserver((entries)=>{
        if (entries.some(e=> e.isIntersecting)) { ensureMap(); io.disconnect(); }
      }, { rootMargin: "200px" });
      io.observe(mapEl);
    }
    renderList();
    if (ciudadHash) { applyFilters(); }
  }

  document.addEventListener("DOMContentLoaded", ()=> { init().catch(()=> showToast("No se pudieron cargar spots")); });
})();
