"use strict";

// Utilidades DOM
const qs = (sel, el = document) => el.querySelector(sel);
const qsa = (sel, el = document) => Array.from(el.querySelectorAll(sel));
const on = (el, evt, cb) => el && el.addEventListener(evt, cb);
const debounce = (fn, wait = 200) => {
	let t;
	return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
};

// Toasts
function showToast(msg, type = "info") {
	const cont = qs("#toast-container");
	if (!cont) return;
	const t = document.createElement("div");
	t.className = "toast";
	t.setAttribute("role", "status");
	t.textContent = msg;
	cont.appendChild(t);
	setTimeout(() => { t.remove(); }, 2800);
}

// Nav móvil
function setupNav() {
	const toggle = qs(".nav-toggle");
	const menu = qs("#nav-menu");
	on(toggle, "click", () => {
		const expanded = toggle.getAttribute("aria-expanded") === "true";
		toggle.setAttribute("aria-expanded", String(!expanded));
		menu.classList.toggle("open");
	});
	// cerrar al navegar
	qsa(".nav-link").forEach((a) => on(a, "click", () => {
		qs(".nav-menu")?.classList.remove("open");
		qs(".nav-toggle")?.setAttribute("aria-expanded", "false");
	}));
	
	// Marcar página activa
	const currentPage = window.location.pathname.split('/').pop() || 'index.html';
	qsa(".nav-link").forEach((link) => {
		const href = link.getAttribute('href');
		if (href === currentPage || (currentPage === '' && href === 'index.html')) {
			link.classList.add('active');
		} else {
			link.classList.remove('active');
		}
	});
}

// Back to top
function setupBackToTop() {
	const btn = qs("#back-to-top");
	if (!btn) return;
	on(btn, "click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

// IntersectionObserver
function setupReveal() {
	const els = qsa(".reveal");
	if (!("IntersectionObserver" in window) || els.length === 0) return;
	const io = new IntersectionObserver((entries) => {
		entries.forEach((e) => {
			if (e.isIntersecting) {
				e.target.classList.add("is-visible");
				io.unobserve(e.target);
			}
		});
	}, { threshold: 0.1 });
	els.forEach((el) => io.observe(el));
}

// Cache JSON en sessionStorage
async function getJSONCached(url) {
	const key = "cache:" + url;
	const cached = sessionStorage.getItem(key);
	if (cached) {
		try { return JSON.parse(cached); } catch {}
	}
	const res = await fetch(url);
	if (!res.ok) throw new Error("Error cargando datos");
	const data = await res.json();
	sessionStorage.setItem(key, JSON.stringify(data));
	return data;
}

// Carrusel simple en index
function setupCarousel() {
	const carousel = qs("[data-carousel]");
	if (!carousel) return;
	const track = qs(".carousel-track", carousel);
	const slides = qsa("img", track);
	const prev = qs(".carousel-btn.prev", carousel);
	const next = qs(".carousel-btn.next", carousel);
	let idx = 0;
	function update() {
		track.style.transform = `translateX(-${idx * 100}%)`;
	}
	on(prev, "click", () => { idx = (idx - 1 + slides.length) % slides.length; update(); });
	on(next, "click", () => { idx = (idx + 1) % slides.length; update(); });
	const autoplay = carousel.dataset.autoplay === "true";
	if (autoplay) {
		setInterval(() => { idx = (idx + 1) % slides.length; update(); }, 3500);
	}
	// swipe táctil
	let startX = 0, dx = 0;
	on(track, "touchstart", (e)=> { startX = e.touches[0].clientX; dx = 0; });
	on(track, "touchmove", (e)=> { dx = e.touches[0].clientX - startX; });
	on(track, "touchend", ()=> {
		if (Math.abs(dx) > 50) {
			if (dx < 0) idx = (idx + 1) % slides.length; else idx = (idx - 1 + slides.length) % slides.length;
			update();
		}
		startX = 0; dx = 0;
	});
}

// Header sticky sombra
function setupHeaderShadow() {
	const header = qs(".site-header");
	let last = 0;
	on(window, "scroll", debounce(() => {
		const y = window.scrollY || 0;
		header.style.boxShadow = y > 8 ? "0 2px 16px rgba(0,0,0,.35)" : "none";
		last = y;
	}, 50));
}

// Newsletter demo
function setupNewsletter() {
	const form = qs(".newsletter");
	if (!form) return;
	on(form, "submit", (e) => {
		e.preventDefault();
		const email = qs("input[type=email]", form)?.value || "";
		if (!email.includes("@")) { showToast("Ingresa un correo válido"); return; }
		showToast("¡Gracias por suscribirte!");
		form.reset();
	});
}

// Búsqueda simple
function setupSearch() {
	const btn = qs("#nav-search-btn");
	const input = qs("#nav-search-input");
	if (!btn || !input) return;
	
	const performSearch = () => {
		const query = input.value.trim();
		if (!query) {
			showToast("Escribe algo para buscar");
			return;
		}
		// Simulación de búsqueda - puedes expandir esto
		showToast(`Buscando: "${query}"`);
		// Aquí podrías redirigir a una página de resultados
		// window.location.href = `search.html?q=${encodeURIComponent(query)}`;
	};
	
	on(btn, "click", performSearch);
	on(input, "keypress", (e) => {
		if (e.key === "Enter") {
			e.preventDefault();
			performSearch();
		}
	});
}

// Init común
document.addEventListener("DOMContentLoaded", () => {
	setupNav();
	setupBackToTop();
	setupReveal();
	setupHeaderShadow();
	setupCarousel();
	setupNewsletter();
	setupSearch();
	setupTheme();
		// Poblar destacados en index si existen contenedores
		(async ()=>{
			try {
				const sEl = qs("#destacados-skaters");
				const pEl = qs("#destacados-parches");
				const spEl = qs("#destacados-spots");
				if (sEl) {
					const data = (await getJSONCached("data/skaters.json")).filter(x=> x.destacado).slice(0,3);
					sEl.innerHTML = data.map(s=> `<article class=\"card\"><div class=\"stack\"><img src=\"${s.foto}\" alt=\"${s.nombre}\" loading=\"lazy\" style=\"border-radius:12px; aspect-ratio:16/9; object-fit:cover;\"/><div class=\"between\"><h3>${s.nombre}</h3><span class=\"badge\">${s.nivel}</span></div><p class=\"muted\">${s.ciudad}</p></div></article>`).join("");
				}
				if (pEl) {
					const data = (await getJSONCached("data/parches.json")).slice(0,3);
					pEl.innerHTML = data.map(p=> `<article class=\"card\"><div class=\"stack\"><img src=\"${p.foto}\" alt=\"${p.nombre}\" loading=\"lazy\" style=\"border-radius:12px; aspect-ratio:16/9; object-fit:cover;\"/><div class=\"between\"><h3>${p.nombre}</h3><span class=\"muted\">${p.ciudad}</span></div></div></article>`).join("");
				}
				if (spEl) {
					const data = (await getJSONCached("data/spots.json")).slice(0,3);
					spEl.innerHTML = data.map(s=> `<article class=\"card\"><div class=\"stack\"><img src=\"${s.foto}\" alt=\"${s.nombre}\" loading=\"lazy\" style=\"border-radius:12px; aspect-ratio:16/9; object-fit:cover;\"/><div class=\"between\"><h3>${s.nombre}</h3><span class=\"badge\">${s.dificultad}</span></div><p class=\"muted\">${s.ciudad} • ${s.tipo}</p></div></article>`).join("");
				}
			} catch {}
		})();
});

// Exponer utilidades para otros módulos
window.RP = { qs, qsa, on, debounce, showToast, getJSONCached };

// Tema auto/light/dark
function setupTheme(){
	const btn = qs("#theme-toggle");
	const root = document.documentElement;
	const icon = () => btn?.querySelector("i");
	function apply(theme){
		if (theme === "auto") { root.removeAttribute("data-theme"); }
		else { root.setAttribute("data-theme", theme); }
		if (!btn) return;
		if (theme === "auto") { icon().className = "ri-contrast-line"; btn.setAttribute("aria-label", "Tema automático"); }
		if (theme === "light") { icon().className = "ri-sun-line"; btn.setAttribute("aria-label", "Tema claro"); }
		if (theme === "dark") { icon().className = "ri-moon-line"; btn.setAttribute("aria-label", "Tema oscuro"); }
	}
	let theme = localStorage.getItem("rp:theme") || "auto";
	apply(theme);
	on(btn, "click", ()=>{
		theme = theme === "auto" ? "light" : theme === "light" ? "dark" : "auto";
		localStorage.setItem("rp:theme", theme);
		apply(theme);
	});
}
