const registerConfigIPC = require("./ipc-config");
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn, exec } = require("child_process");

app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

let win;
let reloadTimeout = null;
let settings = { autoStart: false, disableShell: false };

//  Cargar settings.json 
function loadSettings() {
  try {
    let settingsPath;
    if (app.isPackaged) {
      settingsPath = path.join(process.resourcesPath, "settings.json");
    } else {
      settingsPath = path.join(__dirname, "settings.json");
    }

    if (fs.existsSync(settingsPath)) {
      settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
      console.log("Settings cargados:", settings);
    } else {
      console.log("No se encontró settings.json, usando valores por defecto");
    }
  } catch (e) {
    console.error("Error cargando settings:", e.message);
  }
}

//  Guardar settings.json 
function saveSettings() {
  try {
    let settingsPath;
    if (app.isPackaged) {
      settingsPath = path.join(process.resourcesPath, "settings.json");
    } else {
      settingsPath = path.join(__dirname, "settings.json");
    }

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf8");
    console.log("Settings guardados:", settings);
  } catch (e) {
    console.error("Error guardando settings:", e.message);
  }
}

//  Manejar Explorer (GUI de Windows) 
function killExplorer() {
  if (!settings.disableShell) return;

  exec("taskkill /f /im explorer.exe", (err) => {
    if (err) {
      console.error("Error cerrando explorer:", err.message);
    } else {
      console.log("Explorer cerrado");
    }
  });
}

function startExplorer() {
  exec("start explorer.exe", (err) => {
    if (err) {
      console.error("Error abriendo explorer:", err.message);
    } else {
      console.log("Explorer iniciado");
    }
  });
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 720,
    fullscreen: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(__dirname, "public", "launcher", "index.html"));

  win.on("focus", () => win.webContents.send("launcher-focus"));
  win.on("blur", () => win.webContents.send("launcher-blur"));
}

//  Observar cambios en config/ y notificar al renderer 
function startConfigWatcher(configDir) {
  try {
    fs.watch(configDir, { persistent: true }, (eventType, filename) => {
      if (!filename || !filename.endsWith(".json")) return;
      clearTimeout(reloadTimeout);
      reloadTimeout = setTimeout(() => {
        if (win && !win.isDestroyed()) {
          win.webContents.send("config-changed");
        }
      }, 300);
    });
    console.log("Observando config en:", configDir);
  } catch (e) {
    console.error("No se pudo observar config/:", e.message);
  }
}

app.whenReady().then(() => {
  loadSettings(); // Cargar settings al inicio

  // Si disableShell está activo, cerrar explorer
  if (settings.disableShell) {
    setTimeout(() => killExplorer(), 2000); // Delay para evitar conflictos
  }

  const configDir = registerConfigIPC(__dirname); // ← retorna la ruta resuelta
  startConfigWatcher(configDir);                 // ← la pasa al watcher
  createWindow();
});

//  Lanzar juego (puede ser 1 o 2 ejecutables) 
ipcMain.handle("launch-game", async (_, exePath, exePath2, args = []) => {
  if (!exePath) return { ok: false, error: "no path" };

  try {
    // Minimizar launcher antes de lanzar el juego
    if (win && !win.isDestroyed()) {
      // win.setSkipTaskbar(true); // quitar de la barra
      //win.hide();               // ocultar ventana
      win.blur();                 // la quita de foco
    }

    // Obtener directorio del ejecutable
    const cwd1 = path.dirname(exePath);

    console.log("Lanzando juego:");
    console.log("  Ruta:", exePath);
    console.log("  CWD:", cwd1);
    console.log("  Args:", args);

    // Envolver la ruta en comillas para manejar espacios
    const quotedPath = `"${exePath}"`;

    // Lanzar usando shell
    const child1 = spawn(quotedPath, args, {
      cwd: cwd1,
      shell: true,
      windowsHide: false
    });

    child1.on("exit", () => {
      if (win && !win.isDestroyed()) {
        win.setSkipTaskbar(false);
        win.show();
        win.focus();
      }
    });

    // Si hay ejecutable secundario
    if (exePath2) {
      const cwd2 = path.dirname(exePath2);
      const quotedPath2 = `"${exePath2}"`;

      console.log("Lanzando ejecutable secundario:");
      console.log("  Ruta:", exePath2);
      console.log("  CWD:", cwd2);

      const child2 = spawn(quotedPath2, args, {
        detached: true,
        stdio: "ignore",
        cwd: cwd2,
        shell: true,
        windowsHide: false
      });

      child2.on('error', (err) => {
        console.error("Error al lanzar exe2:", err);
      });

      child2.unref();
    }

    return { ok: true };
  } catch (err) {
    console.error("Exception en launch-game:", err);
    return { ok: false, error: String(err) };
  }
});

//  Cerrar la app (abre explorer.exe primero si estaba desactivado) 
ipcMain.on("exit-app", () => {
  // Siempre iniciar explorer al salir (por si estaba desactivado)
  startExplorer();

  // Pequeño delay para que explorer se abra
  setTimeout(() => app.quit(), 500);
});

//  Manejar settings (auto-inicio y shell) 
ipcMain.handle("read-settings", async () => {
  return settings;
});

ipcMain.handle("write-settings", async (_, newSettings) => {
  try {
    const exePath = app.getPath('exe');
    const regKey = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';
    const regName = 'GrooveStation';

    // Actualizar auto-inicio en el registro
    if (newSettings.autoStart) {
      // Agregar al registro
      exec(`reg add "${regKey}" /v "${regName}" /t REG_SZ /d "\\"${exePath}\\"" /f`, (err) => {
        if (err) console.error("Error agregando auto-inicio:", err.message);
        else console.log("Auto-inicio habilitado");
      });
    } else {
      // Eliminar del registro
      exec(`reg delete "${regKey}" /v "${regName}" /f 2>nul`, (err) => {
        // Silenciar error si la clave no existe
        if (!err || err.message.includes("no ha podido encontrar")) {
          console.log("Auto-inicio deshabilitado (o ya estaba deshabilitado)");
        } else {
          //console.error("No se encontró el registro auto-inicio:", err.message);
        }
      });
    }

    // Guardar settings
    settings = newSettings;
    saveSettings();

    return { ok: true };
  } catch (e) {
    console.error("Error guardando settings:", e.message);
    return { ok: false, error: String(e) };
  }
});

app.on("window-all-closed", () => { app.quit(); });
