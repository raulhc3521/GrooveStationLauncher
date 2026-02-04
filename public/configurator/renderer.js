// ARCADE CONFIGURATOR — Proceso Renderer

const gameList = document.getElementById("gameList");
const addGameBtn = document.getElementById("addGameBtn");
const musicList = document.getElementById("musicList");
const addMusicBtn = document.getElementById("addMusicBtn");
const videoList = document.getElementById("videoList");
const addVideoBtn = document.getElementById("addVideoBtn");
const menuList = document.getElementById("menuList");
const addMenuBtn = document.getElementById("addMenuBtn");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");
const autoStartCheckbox = document.getElementById("autoStartCheckbox");
const disableShellCheckbox = document.getElementById("disableShellCheckbox");
const volumeSlider = document.getElementById("volumeSlider");
const volumeLabel = document.getElementById("volumeLabel");

let games = [];
let media = { music: [], backgroundVideos: [] };
let menuItems = [];
let settings = { autoStart: false, disableShell: false };

// Copia inicial para detectar cambios
let initialState = null;

//  HELPERS 
function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function saveAll() {
  window.api.writeConfig("games", games);
  window.api.writeConfig("media", media);
  window.api.writeConfig("menu", menuItems);

  // Guardar settings del sistema
  settings.autoStart = autoStartCheckbox.checked;
  settings.disableShell = disableShellCheckbox.checked;
  window.api.writeSettings(settings);

  // Actualizar estado inicial tras guardar
  initialState = JSON.stringify({ games, media, menuItems, settings });

  alert("✅ Cambios guardados correctamente");
  window.close();
  app.quit();
}

function cancelChanges() {
  if (!initialState) return;

  const confirmed = confirm("⚠️ ¿Descartar todos los cambios y recargar?");
  if (!confirmed) return;

  // Recargar desde el estado inicial
  const state = JSON.parse(initialState);
  games = state.games;
  media = state.media;
  menuItems = state.menuItems;
  settings = state.settings || { autoStart: false, disableShell: false };

  // Restaurar checkboxes
  autoStartCheckbox.checked = settings.autoStart;
  disableShellCheckbox.checked = settings.disableShell;

  renderGames();
  renderMusic();
  renderVideos();
  renderMenu();
}

// CARGA INICIAL 
async function load() {
  const g = await window.api.readConfig("games");
  const md = await window.api.readConfig("media");
  const m = await window.api.readConfig("menu");

  // Validar ANTES de asignar
  if (!g || g.error) { console.error("games:", g); return; }
  if (!md || md.error) { console.error("media:", md); return; }
  if (!m || m.error) { console.error("menu:", m); return; }

  // Ahora sí asignar
  games = g;
  menuItems = m;

  // Migrar backgroundVideo → backgroundVideos si es necesario
  media = md;
  if (md.backgroundVideo && !md.backgroundVideos) {
    media.backgroundVideos = [md.backgroundVideo];
    delete media.backgroundVideo;
  }
  if (!media.backgroundVideos) media.backgroundVideos = [];
  if (!media.music) media.music = [];

  // Cargar volumen
  if (media.volume !== undefined) {
    volumeSlider.value = media.volume;
    volumeLabel.textContent = media.volume + "%";
  } else {
    media.volume = 80; // Default
  }

  // Cargar settings del sistema (de forma defensiva)
  try {
    const s = await window.api.readSettings();
    if (s && !s.error) {
      settings = s;
      autoStartCheckbox.checked = settings.autoStart || false;
      disableShellCheckbox.checked = settings.disableShell || false;
    } else {
      // Si falla, usar valores por defecto
      settings = { autoStart: false, disableShell: false };
      autoStartCheckbox.checked = false;
      disableShellCheckbox.checked = false;
    }
  } catch (e) {
    console.warn("No se pudieron cargar settings, usando valores por defecto:", e);
    settings = { autoStart: false, disableShell: false };
    autoStartCheckbox.checked = false;
    disableShellCheckbox.checked = false;
  }

  // Guardar estado inicial
  initialState = JSON.stringify({ games, media, menuItems, settings });

  renderGames();
  renderMusic();
  renderVideos();
  renderMenu();
}

//  JUEGOS (con exe2) 
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
      '<label>Ejecutable 1</label>' +
      '<input type="text" class="exe" value="' + escapeHtml(gm.exe) + '" data-i="' + i + '">' +
      '<button class="browse-exe" data-i="' + i + '">📂</button>' +
      '</div>' +
      '<div class="field">' +
      '<label>Ejecutable 2</label>' +
      '<input type="text" class="exe2" value="' + escapeHtml(gm.exe2 || "") + '" data-i="' + i + '">' +
      '<button class="browse-exe2" data-i="' + i + '">📂</button>' +
      '</div>' +
      '<div class="field">' +
      '<label>Imagen (logo)</label>' +
      '<input type="text" class="img" value="' + escapeHtml(gm.image) + '" data-i="' + i + '" readonly>' +
      '<button class="browse-image" data-i="' + i + '">🖼️</button>' +
      '</div>' +
      (gm.image ? '<img src="file:///' + gm.image.replace(/\\/g, '/') + '" class="image-preview" alt="Preview">' : '') +
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
    });
  });

  gameList.querySelectorAll(".exe").forEach(inp => {
    inp.addEventListener("input", e => {
      games[+e.target.dataset.i].exe = e.target.value;
    });
  });

  gameList.querySelectorAll(".browse-exe").forEach(btn => {
    btn.addEventListener("click", async e => {
      const file = await window.api.openExe();
      if (file) {
        games[+e.target.dataset.i].exe = file;
        renderGames();
      }
    });
  });

  gameList.querySelectorAll(".exe2").forEach(inp => {
    inp.addEventListener("input", e => {
      games[+e.target.dataset.i].exe2 = e.target.value;
    });
  });

  gameList.querySelectorAll(".browse-exe2").forEach(btn => {
    btn.addEventListener("click", async e => {
      const file = await window.api.openExe();
      if (file) {
        games[+e.target.dataset.i].exe2 = file;
        renderGames();
      }
    });
  });

  gameList.querySelectorAll(".image").forEach(inp => {
    inp.addEventListener("input", e => {
      games[+e.target.dataset.i].image = e.target.value;
    });
  });

  gameList.querySelectorAll(".browse-image").forEach(btn => {
    btn.addEventListener("click", async e => {
      const i = +e.target.dataset.i;
      const file = await window.api.openImage();
      if (file) {
        games[i].image = file;
        renderGames();
      }
    });
  });

  gameList.querySelectorAll(".enabled").forEach(cb => {
    cb.addEventListener("change", e => {
      games[+e.target.dataset.i].enabled = e.target.checked;
    });
  });

  gameList.querySelectorAll(".del").forEach(btn => {
    btn.addEventListener("click", e => {
      games.splice(+e.target.dataset.i, 1);
      renderGames();
    });
  });
}

addGameBtn.addEventListener("click", () => {
  games.push({
    id: "g" + Date.now(),
    name: "Nuevo juego",
    exe: "",
    exe2: "",
    image: "",
    enabled: true
  });
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
    });
  });

  musicList.querySelectorAll(".delm").forEach(btn => {
    btn.addEventListener("click", e => {
      media.music.splice(+e.target.dataset.i, 1);
      renderMusic();
    });
  });
}

addMusicBtn.addEventListener("click", async () => {
  const file = await window.api.openFile({
    filters: [{ name: "Audio", extensions: ["ogg", "mp3", "wav"] }]
  });
  if (file) { media.music.push(file); renderMusic(); }
});

//  VIDEOS DE FONDO (MÚLTIPLES) 
function renderVideos() {
  videoList.innerHTML = "";

  media.backgroundVideos.forEach((v, i) => {
    const li = document.createElement("li");
    li.innerHTML =
      '<input class="vtrack" data-i="' + i + '" value="' + escapeHtml(v) + '">' +
      '<button class="del-video" data-i="' + i + '">🗑️</button>';
    videoList.appendChild(li);
  });

  videoList.querySelectorAll(".vtrack").forEach(inp => {
    inp.addEventListener("input", e => {
      media.backgroundVideos[+e.target.dataset.i] = e.target.value;
    });
  });

  videoList.querySelectorAll(".del-video").forEach(btn => {
    btn.addEventListener("click", e => {
      media.backgroundVideos.splice(+e.target.dataset.i, 1);
      renderVideos();
    });
  });
}

addVideoBtn.addEventListener("click", async () => {
  const file = await window.api.openFile({
    filters: [{ name: "Video", extensions: ["mp4", "mov", "mkv", "avi"] }]
  });
  if (file) { media.backgroundVideos.push(file); renderVideos(); }
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
      '<label>Ejecutable (opcional)</label>' +
      '<input class="menu-exe" value="' + escapeHtml(item.exe || '') + '" data-i="' + i + '" readonly>' +
      '<button class="browse-menu-exe" data-i="' + i + '">📁</button>' +
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
    });
  });

  menuList.querySelectorAll(".menu-command").forEach(inp => {
    inp.addEventListener("input", e => {
      menuItems[+e.target.dataset.i].command = e.target.value;
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
    });
  });

  menuList.querySelectorAll(".menu-exe").forEach(inp => {
    inp.addEventListener("input", e => {
      menuItems[+e.target.dataset.i].exe = e.target.value;
    });
  });

  menuList.querySelectorAll(".del-menu").forEach(btn => {
    btn.addEventListener("click", e => {
      menuItems.splice(+e.target.dataset.i, 1);
      renderMenu();
    });
  });

  menuList.querySelectorAll(".browse-menu-exe").forEach(btn => {
    btn.addEventListener("click", async e => {
      const i = +e.target.dataset.i;
      const file = await window.api.openExe();
      if (file) {
        menuItems[i].exe = file;
        renderMenu();
      }
    });
  });
}

addMenuBtn.addEventListener("click", () => {
  menuItems.push({ id: "m" + Date.now(), label: "Nueva opcion", command: "" });
  renderMenu();
});

//  BOTONES PRINCIPALES 
saveBtn.addEventListener("click", saveAll);
cancelBtn.addEventListener("click", cancelChanges);

// CONTROL DE VOLUMEN
volumeSlider.addEventListener("input", (e) => {
  const vol = e.target.value;
  media.volume = parseInt(vol);
  volumeLabel.textContent = vol + "%";
});

// INICIO 
window.addEventListener("DOMContentLoaded", load);
