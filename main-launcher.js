const registerConfigIPC = require("./ipc-config");
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

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
  win.on("blur", () => win.webContents.send("launcher-blur"));
}

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

// Lanzar juego (puede ser 1 o 2 ejecutables)
ipcMain.handle("launch-game", async (_, exePath, exePath2, args = []) => {
  if (!exePath) return { ok: false, error: "no path" };
  
  try {
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
      detached: true, 
      stdio: "ignore",
      cwd: cwd1,
      shell: true,  
      windowsHide: false
    });
    
    // Capturar errores del proceso
    child1.on('error', (err) => {
      console.error("Error al lanzar juego:", err);
    });
    
    child1.unref();
    
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


// Cerrar la app (abre explorer.exe primero) 
ipcMain.on("exit-app", () => {
  try {
    // Abrir explorer antes de cerrar
    spawn("explorer.exe", [], { detached: true, stdio: "ignore" }).unref();
  } catch (e) {
    console.error("No se pudo abrir explorer:", e);
  }

  // Pequeño delay para que explorer se abra
  setTimeout(() => app.quit(), 200);
});


app.on("window-all-closed", () => { app.quit(); });
