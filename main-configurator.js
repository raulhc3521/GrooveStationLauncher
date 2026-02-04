const registerConfigIPC = require("./ipc-config");
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");

let win;
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

function createWindow() {
  win = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(__dirname, "public", "configurator", "index.html"));
}

app.whenReady().then(() => {
  loadSettings(); // Cargar settings al inicio
  registerConfigIPC(__dirname);

  // Registrar handlers de settings
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
            //console.error("No se encontró el registro auto-inicio::", err.message);
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

  createWindow();
});

app.on("window-all-closed", () => { app.quit(); });