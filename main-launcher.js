const registerConfigIPC = require("./ipc-config");
const { app, BrowserWindow, ipcMain } = require("electron");
const path       = require("path");
const fs         = require("fs");
const { spawn }  = require("child_process");

// Permitir autoplay de audio sin gesto del usuario (necesario para el sonido "start" y música)
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

let win;
let reloadTimeout = null;

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
  win.on("blur",  () => win.webContents.send("launcher-blur"));
}

// Observar cambios en config/ y notificar al renderer 
function startConfigWatcher() {
  const configDir = path.join(__dirname, "config");
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
  } catch (e) {
    console.error("No se pudo observar config/:", e.message);
  }
}

app.whenReady().then(() => {
  registerConfigIPC(__dirname);
  startConfigWatcher();
  createWindow();
});

// Lanzar juego (sin minimizar — el juego tapa la ventana solo)
ipcMain.handle("launch-game", async (_, exePath, args = []) => {
  if (!exePath) return { ok: false, error: "no path" };
  try {
    const child = spawn(exePath, args, { detached: true, stdio: "ignore" });
    child.unref();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
});

// Cerrar la app
ipcMain.on("exit-app", () => { app.quit(); });

app.on("window-all-closed", () => { app.quit(); });
