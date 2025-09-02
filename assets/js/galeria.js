"use strict";

(function(){
  const { qs, qsa, on, getJSONCached } = window.RP;

  let images = [];
  const notes = Array.from({ length: 6 }).map((_,i)=> ({
    id: i+1,
    title: `Crónica ${i+1}`,
    text: "Resumen breve del evento. Texto de ejemplo.",
    tag: ["eventos","competencias","entrenos"][i%3]
  }));

  const state = { tag: "", filtered: [], index: 0 };

  function render(){
    const m = qs("#masonry");
    m.innerHTML = state.filtered.map(img => `
      <figure>
        <img src="${img.url}" alt="${img.caption}" loading="lazy" data-id="${img.id}" />
        <figcaption class="caption">${img.caption} — <span class="badge">${img.tag}</span></figcaption>
      </figure>
    `).join("");
    qsa("#masonry img").forEach(img => on(img, "click", ()=> openLightbox(+img.dataset.id)));

    const c = qs("#cronicas");
    c.innerHTML = notes.map(n=> `
      <article class="card">
        <h3>${n.title}</h3>
        <p class="muted">${n.tag}</p>
        <p>${n.text}</p>
        <button class="btn ghost">Leer más</button>
      </article>
    `).join("");
  }

  function openLightbox(id){
    const idx = state.filtered.findIndex(x=> x.id === id);
    if (idx < 0) return; state.index = idx;
    const modal = qs("#lightbox");
    const img = qs("#lightbox-image");
    const cap = qs("#lightbox-caption");
    const it = state.filtered[state.index];
    img.src = it.url; img.alt = it.caption; cap.textContent = it.caption;
    modal.setAttribute("aria-hidden", "false");
  }

  function step(dir){
    state.index = (state.index + dir + state.filtered.length) % state.filtered.length;
    const it = state.filtered[state.index];
    const img = qs("#lightbox-image");
    const cap = qs("#lightbox-caption");
    img.src = it.url; img.alt = it.caption; cap.textContent = it.caption;
  }

  function close(){ qs("#lightbox").setAttribute("aria-hidden", "true"); }

  function bindLightbox(){
    on(qs(".lightbox-nav.prev"), "click", ()=> step(-1));
    on(qs(".lightbox-nav.next"), "click", ()=> step(1));
    on(qs("#lightbox .modal-close"), "click", close);
    on(qs("#lightbox"), "click", (e)=> { if (e.target.id === "lightbox") close(); });
    document.addEventListener("keydown", (e)=>{
      if (qs("#lightbox").getAttribute("aria-hidden") === "true") return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    });
  }

  function bindFilters(){
    qsa("#galeria-filtros .chip").forEach(chip => on(chip, "click", ()=>{
      qsa("#galeria-filtros .chip").forEach(c=> c.classList.remove("active"));
      chip.classList.add("active");
      state.tag = chip.dataset.tag || "";
      state.filtered = state.tag ? images.filter(i=> i.tag === state.tag) : images;
      render();
    }));
  }

  async function init(){
    try {
      images = await getJSONCached("data/galeria.json");
      state.filtered = images;
      render();
      bindFilters();
      bindLightbox();
    } catch {
      // fallback simple por si no carga
      images = [];
      state.filtered = [];
      render();
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
