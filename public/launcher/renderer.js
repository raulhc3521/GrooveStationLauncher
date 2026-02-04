// ARCADE LAUNCHER — Proceso Renderer

const carouselRoot  = document.getElementById("carousel");
const systemMenu    = document.getElementById("systemMenu");
const bgVideo       = document.getElementById("bgVideo");
const splashOverlay = document.getElementById("splashOverlay");
const viewport      = document.querySelector(".viewport");
const backgroundBar = document.querySelector(".logo-background-bar");
const menuArrowLeft = document.getElementById("menuArrowLeft");
const menuArrowRight = document.getElementById("menuArrowRight");

let games = [];
let menu  = [];
let media = {};

let items       = [];
let index       = 0;
let menuItems   = [];
let menuIndex   = 0;
let menuVisible = false;
let bgMusic     = null;
let fadeTimer   = null;

let currentBgVideoSrc = "";
let navigationLocked  = false; // Para debounce

//  HELPER DE RUTAS 
function resolvePath(p) {
  if (!p) return "";
  if (/^[A-Za-z]:[/\\]/.test(p)) {
    return "file:///" + encodeURI(p.replace(/\\/g, "/"));
  }
  return "../../" + p.replace(/\\/g, "/").replace(/^\.\//, "");
}

//  SONIDOS UI 
function playSound(name) {
  const files = { 
    move:   "move.mp3", 
    select: "select.ogg",
    start:  "start.ogg"
  };
  const file = files[name];
  if (!file) return;
  const audio = new Audio("../../assets/sounds/" + file);
  audio.play().catch(err => console.warn("Audio play failed:", err));
}

//  VIDEO DE FONDO (MÚLTIPLES VIDEOS ALEATORIOS) 
function loadVideo() {
  // media.backgroundVideos es un array ahora
  const videos = media.backgroundVideos || [];
  if (!videos.length) return;

  const randomVideo = videos[Math.floor(Math.random() * videos.length)];
  const resolved    = resolvePath(randomVideo);
  
  if (!resolved || resolved === currentBgVideoSrc) return;

  console.log("Cargando video de fondo:", resolved);
  currentBgVideoSrc = resolved;
  bgVideo.src       = resolved;
  bgVideo.load();
  bgVideo.play().catch(err => console.error("Error al reproducir video:", err));
}

//  CARGA DE CONFIG 
async function loadAll() {
  const g  = await window.api.readConfig("games");
  const m  = await window.api.readConfig("menu");
  const md = await window.api.readConfig("media");

  if (g.error || m.error || md.error) {
    console.error("Error al cargar config:", { games: g, menu: m, media: md });
    return;
  }

  games = g.filter(x => x.enabled);
  menu  = m;
  media = md;

  console.log("Config cargada:", { games: games.length, menu: menu.length, media });
}

//  RECARGA SILENTE 
async function reloadConfig() {
  const g  = await window.api.readConfig("games");
  const m  = await window.api.readConfig("menu");
  const md = await window.api.readConfig("media");

  if (g.error || m.error || md.error) return;

  games = g.filter(x => x.enabled);
  menu  = m;
  media = md;

  loadVideo();
  renderCarousel();
  renderMenu();
}

//  SPLASH 
function showSplash() {
  splashOverlay.classList.remove("hidden");
  void splashOverlay.offsetWidth;
  splashOverlay.classList.add("visible");

  setTimeout(() => {
    splashOverlay.classList.remove("visible");
    setTimeout(() => {
      splashOverlay.classList.add("hidden");
      onSplashFinished();
    }, 300);
  }, 4000);
}

function onSplashFinished() {
  loadVideo();
  renderCarousel();
  renderMenu();
  startBackgroundMusic();
}

//  CARRUSEL 
function renderCarousel() {
  carouselRoot.innerHTML = "";

  games.forEach((g, i) => {
    const div     = document.createElement("div");
    div.className = "item" + (i === 0 ? " active" : "");

    const img   = document.createElement("img");
    img.src     = resolvePath(g.image);
    img.alt     = g.name;

    const label       = document.createElement("div");
    label.className   = "label";
    label.textContent = g.name;

    div.appendChild(img);
    div.appendChild(label);
    carouselRoot.appendChild(div);
  });

  items = document.querySelectorAll(".item");
  index = 0;
  updateCarousel();
}

function updateCarousel() {
  items.forEach((el, i) => el.classList.toggle("active", i === index));

  const active = items[index];
  if (!active) return;

  const rect   = active.getBoundingClientRect();
  const center = window.innerWidth / 2;
  const delta  = center - (rect.left + rect.width / 2);

  const t     = carouselRoot.style.transform;
  const match = t && t.match(/-?[\d.]+/);
  const x     = match ? parseFloat(match[0]) || 0 : 0;

  carouselRoot.style.transform = `translateX(${x + delta}px)`;
}

//  MENU DEL SISTEMA (CENTRADO COMO CARRUSEL) 
function renderMenu() {
  systemMenu.innerHTML = "";
  
  // Crear contenedor interno que se desplaza
  const menuCarousel = document.createElement("div");
  menuCarousel.className = "menu-carousel";
  menuCarousel.id = "menuCarousel";
  
  menu.forEach((item, i) => {
    const div       = document.createElement("div");
    div.className   = "menu-item" + (i === 0 ? " menu-active" : "");
    div.textContent = item.label;
    menuCarousel.appendChild(div);
  });
  
  systemMenu.appendChild(menuCarousel);
  menuItems = menuCarousel.querySelectorAll(".menu-item");
}

function updateMenuHighlight() {
  menuItems.forEach((el, i) => el.classList.toggle("menu-active", i === menuIndex));
  
  // Centrar el item activo (igual que carrusel de juegos)
  const active = menuItems[menuIndex];
  if (!active) return;
  
  const menuCarousel = document.getElementById("menuCarousel");
  const rect   = active.getBoundingClientRect();
  const center = window.innerWidth / 2;
  const delta  = center - (rect.left + rect.width / 2);
  
  const t     = menuCarousel.style.transform;
  const match = t && t.match(/-?[\d.]+/);
  const x     = match ? parseFloat(match[0]) || 0 : 0;
  
  menuCarousel.style.transform = `translateX(${x + delta}px)`;
}

function showMenu() {
  menuVisible = true;
  menuIndex   = 0;
  systemMenu.classList.remove("hidden");
  systemMenu.classList.remove("fully-hidden");
  viewport.classList.add("menu-open"); // Desplaza juegos hacia abajo
  backgroundBar.classList.add("menu-open"); // Desplaza fondo blanco también
  menuArrowLeft.classList.add("visible"); // Muestra flechas del menú
  menuArrowRight.classList.add("visible");
  updateMenuHighlight();
  playSound("move");
}

function hideMenu() {
  menuVisible = false;
  systemMenu.classList.add("hidden");
  viewport.classList.remove("menu-open");
  backgroundBar.classList.remove("menu-open"); // Restablece posición del fondo
  menuArrowLeft.classList.remove("visible"); // Oculta flechas del menú
  menuArrowRight.classList.remove("visible");
  playSound("move");
  
  setTimeout(() => {
    if (!menuVisible) {
      systemMenu.classList.add("fully-hidden");
    }
  }, 300);
}

async function executeMenuAction(item) {
  playSound("select");
  if (item.action === "exit") { window.api.exitApp(); return; }
  if (item.command)           { await window.api.execCommand(item.command); }
}

//  MUSICA DE FONDO 
function startBackgroundMusic() {
  if (!media.music || !media.music.length) return;

  const track    = media.music[Math.floor(Math.random() * media.music.length)];
  bgMusic        = new Audio(resolvePath(track));
  bgMusic.loop   = true;
  bgMusic.volume = 0;
  bgMusic.play().catch(() => {});
  
  fadeInMusic();
}

function fadeOutMusic(duration) {
  if (!bgMusic) return;
  duration = duration || 2000;
  clearInterval(fadeTimer);
  const steps   = 20;
  const stepAmt = bgMusic.volume / steps;
  fadeTimer = setInterval(() => {
    if (bgMusic.volume > stepAmt) { bgMusic.volume -= stepAmt; }
    else { bgMusic.volume = 0; bgMusic.pause(); clearInterval(fadeTimer); }
  }, duration / steps);
}

function fadeInMusic() {
  if (!bgMusic) return;
  clearInterval(fadeTimer);
  if (bgMusic.paused) bgMusic.play().catch(() => {});
  const stepAmt = 0.04;
  fadeTimer = setInterval(() => {
    if (bgMusic.volume < 0.4 - stepAmt) { bgMusic.volume += stepAmt; }
    else { bgMusic.volume = 0.4; clearInterval(fadeTimer); }
  }, 50);
}

window.addEventListener("focus", () => fadeInMusic());
window.addEventListener("blur",  () => fadeOutMusic());

//  TECLADO 
document.addEventListener("keydown", async (e) => {

  if (!menuVisible) {
    //  Modo carousel 
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (navigationLocked) return; // Evita spam
      navigationLocked = true;
      
      index = (index - 1 + items.length) % items.length;
      playSound("move");
      updateCarousel();
      
      setTimeout(() => { navigationLocked = false; }, 200); // Unlock tras 200ms

    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (navigationLocked) return;
      navigationLocked = true;
      
      index = (index + 1) % items.length;
      playSound("move");
      updateCarousel();
      
      setTimeout(() => { navigationLocked = false; }, 200);

    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      showMenu();

    } else if (e.key === "Enter") {
      e.preventDefault();
      const g = games[index];
      if (!g) return;
      playSound("select");
      // Lanzar con exe y exe2 (si existe)
      setTimeout(() => window.api.launchGame(g.exe, g.exe2 || null), 200);
    }

  } else {
    //  Modo menú 
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (navigationLocked) return;
      navigationLocked = true;
      
      menuIndex = (menuIndex - 1 + menu.length) % menu.length;
      updateMenuHighlight();
      playSound("move");
      
      setTimeout(() => { navigationLocked = false; }, 200);

    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (navigationLocked) return;
      navigationLocked = true;
      
      menuIndex = (menuIndex + 1) % menu.length;
      updateMenuHighlight();
      playSound("move");
      
      setTimeout(() => { navigationLocked = false; }, 200);

    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      hideMenu();

    } else if (e.key === "Enter") {
      e.preventDefault();
      if (menu[menuIndex]) executeMenuAction(menu[menuIndex]);
    }
  }
});

//  INICIO 
window.addEventListener("DOMContentLoaded", () => {
  showSplash();
  playSound("start");
  loadAll();
  window.api.onConfigChanged(() => reloadConfig());
});
