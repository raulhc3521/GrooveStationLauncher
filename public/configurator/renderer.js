// ARCADE CONFIGURATOR — Proceso Renderer

const gameList     = document.getElementById("gameList");
const addGameBtn   = document.getElementById("addGameBtn");
const musicList    = document.getElementById("musicList");
const addMusicBtn  = document.getElementById("addMusicBtn");
const bgVideoInput = document.getElementById("bgVideoInput");
const pickVideoBtn = document.getElementById("pickVideo");
const menuList     = document.getElementById("menuList");
const addMenuBtn   = document.getElementById("addMenuBtn");

let games     = [];
let media     = { music: [], backgroundVideo: "" };
let menuItems = [];

//  HELPERS 
function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;");
}

function saveGames()  { window.api.writeConfig("games",  games);     }
function saveMedia()  { window.api.writeConfig("media",  media);     }
function saveMenu()   { window.api.writeConfig("menu",   menuItems); }

//  CARGA INICIAL 
async function load() {
  const g  = await window.api.readConfig("games");
  const md = await window.api.readConfig("media");
  const m  = await window.api.readConfig("menu");

  if (!g  || g.error)  { console.error("games:", g);  return; }
  if (!md || md.error) { console.error("media:", md); return; }
  if (!m  || m.error)  { console.error("menu:",  m);  return; }

  games     = g;
  media     = md;
  menuItems = m;

  renderGames();
  renderMusic();
  renderMenu();
  bgVideoInput.value = media.backgroundVideo || "";
}

//  JUEGOS 
function renderGames() {
  gameList.innerHTML = "";

  games.forEach((gm, i) => {
    const li = document.createElement("li");
    li.innerHTML =
      '<div class="field">' +
        '<label>Nombre</label>' +
        '<input class="name" value="' + escapeHtml(gm.name) + '" data-i="' + i + '">' +
      '</div>' +
      '<div class="field">' +
        '<label>Ejecutable</label>' +
        '<input type="text" class="exe" value="' + escapeHtml(gm.exe) + '" data-i="' + i + '">' +
        '<button class="browse-exe" data-i="' + i + '">📂</button>' +
      '</div>' +
      '<div class="field">' +
        '<label>Imagen (logo)</label>' +
        '<input type="text" class="image" value="' + escapeHtml(gm.image || "") + '" data-i="' + i + '">' +
        '<button class="browse-image" data-i="' + i + '">🖼️</button>' +
      '</div>' +
      '<div class="field">' +
        '<label><input type="checkbox" class="enabled" data-i="' + i + '" ' + (gm.enabled ? "checked" : "") + '> Habilitado</label>' +
        '<button class="del" data-i="' + i + '">🗑️ Eliminar</button>' +
      '</div>';
    gameList.appendChild(li);
  });

  //  Eventos 
  gameList.querySelectorAll(".name").forEach(inp => {
    inp.addEventListener("input", e => {
      games[+e.target.dataset.i].name = e.target.value;
      saveGames();
    });
  });

  gameList.querySelectorAll(".exe").forEach(inp => {
    inp.addEventListener("input", e => {
      games[+e.target.dataset.i].exe = e.target.value;
      saveGames();
    });
  });

  gameList.querySelectorAll(".browse-exe").forEach(btn => {
    btn.addEventListener("click", async e => {
      const file = await window.api.openExe();
      if (file) {
        games[+e.target.dataset.i].exe = file;
        saveGames();
        renderGames();
      }
    });
  });

  gameList.querySelectorAll(".image").forEach(inp => {
    inp.addEventListener("input", e => {
      games[+e.target.dataset.i].image = e.target.value;
      saveGames();
    });
  });

  gameList.querySelectorAll(".browse-image").forEach(btn => {
    btn.addEventListener("click", async e => {
      const file = await window.api.openImage();
      if (file) {
        games[+e.target.dataset.i].image = file;
        saveGames();
        renderGames();
      }
    });
  });

  gameList.querySelectorAll(".enabled").forEach(cb => {
    cb.addEventListener("change", e => {
      games[+e.target.dataset.i].enabled = e.target.checked;
      saveGames();
    });
  });

  gameList.querySelectorAll(".del").forEach(btn => {
    btn.addEventListener("click", e => {
      games.splice(+e.target.dataset.i, 1);
      saveGames();
      renderGames();
    });
  });
}

addGameBtn.addEventListener("click", () => {
  games.push({ id: "g" + Date.now(), name: "Nuevo juego", exe: "", image: "", enabled: true });
  saveGames();
  renderGames();
});

//  MUSICA 
function renderMusic() {
  musicList.innerHTML = "";

  media.music.forEach((m, i) => {
    const li = document.createElement("li");
    li.innerHTML =
      '<input class="mtrack" data-i="' + i + '" value="' + escapeHtml(m) + '">' +
      '<button class="delm" data-i="' + i + '">🗑️</button>';
    musicList.appendChild(li);
  });

  musicList.querySelectorAll(".mtrack").forEach(inp => {
    inp.addEventListener("input", e => {
      media.music[+e.target.dataset.i] = e.target.value;
      saveMedia();
    });
  });

  musicList.querySelectorAll(".delm").forEach(btn => {
    btn.addEventListener("click", e => {
      media.music.splice(+e.target.dataset.i, 1);
      saveMedia();
      renderMusic();
    });
  });
}

addMusicBtn.addEventListener("click", async () => {
  const file = await window.api.openFile({
    filters: [{ name: "Audio", extensions: ["ogg", "mp3", "wav"] }]
  });
  if (file) { media.music.push(file); saveMedia(); renderMusic(); }
});

pickVideoBtn.addEventListener("click", async () => {
  const file = await window.api.openFile({
    filters: [{ name: "Video", extensions: ["mp4", "mov", "mkv", "avi"] }]
  });
  if (file) { bgVideoInput.value = file; media.backgroundVideo = file; saveMedia(); }
});

bgVideoInput.addEventListener("input", () => {
  media.backgroundVideo = bgVideoInput.value;
  saveMedia();
});

//  MENU DEL SISTEMA 
function renderMenu() {
  menuList.innerHTML = "";

  menuItems.forEach((item, i) => {
    const li = document.createElement("li");
    li.innerHTML =
      '<div class="field">' +
        '<label>Etiqueta</label>' +
        '<input class="menu-label" data-i="' + i + '" value="' + escapeHtml(item.label) + '">' +
      '</div>' +
      '<div class="field">' +
        '<label>Comando (shell)</label>' +
        '<input class="menu-command" data-i="' + i + '" value="' + escapeHtml(item.command || "") + '">' +
      '</div>' +
      '<div class="field">' +
        '<label>Accion especial</label>' +
        '<select class="menu-action" data-i="' + i + '">' +
          '<option value=""' + (!item.action ? ' selected' : '') + '>— Ninguna</option>' +
          '<option value="exit"' + (item.action === "exit" ? ' selected' : '') + '>Cerrar launcher</option>' +
        '</select>' +
        '<button class="del-menu" data-i="' + i + '">🗑️ Eliminar</button>' +
      '</div>';
    menuList.appendChild(li);
  });

  menuList.querySelectorAll(".menu-label").forEach(inp => {
    inp.addEventListener("input", e => {
      menuItems[+e.target.dataset.i].label = e.target.value;
      saveMenu();
    });
  });

  menuList.querySelectorAll(".menu-command").forEach(inp => {
    inp.addEventListener("input", e => {
      menuItems[+e.target.dataset.i].command = e.target.value;
      saveMenu();
    });
  });

  menuList.querySelectorAll(".menu-action").forEach(sel => {
    sel.addEventListener("change", e => {
      const val = e.target.value;
      if (val) {
        menuItems[+e.target.dataset.i].action = val;
      } else {
        delete menuItems[+e.target.dataset.i].action;
      }
      saveMenu();
    });
  });

  menuList.querySelectorAll(".del-menu").forEach(btn => {
    btn.addEventListener("click", e => {
      menuItems.splice(+e.target.dataset.i, 1);
      saveMenu();
      renderMenu();
    });
  });
}

addMenuBtn.addEventListener("click", () => {
  menuItems.push({ id: "m" + Date.now(), label: "Nueva opcion", command: "" });
  saveMenu();
  renderMenu();
});

//  INICIO 
window.addEventListener("DOMContentLoaded", load);
