const { ipcMain, dialog, app } = require("electron");
const fs   = require("fs");
const path = require("path");

module.exports = function registerConfigIPC(baseDir) {

  // Resolver carpeta de config 
  // En desarrollo:  usa config/ del proyecto (lectura + escritura)
  // Empaquetado:    copia config/ a userData la primera vez,
  //                 luego lee/escribe desde ahí
  function getConfigDir() {
    // Si estamos empaquetado (app.isPackaged = true)
    if (app.isPackaged) {
      const userDataConfig = path.join(app.getPath("userData"), "config");

      // Si no existe aún en userData → copiar desde resources (bundled)
      if (!fs.existsSync(userDataConfig)) {
        fs.mkdirSync(userDataConfig, { recursive: true });

        // La carpeta config bundled está en resources/config (extraResources)
        const bundledConfig = path.join(process.resourcesPath, "config");

        if (fs.existsSync(bundledConfig)) {
          // Copiar cada .json que traiga el instalador
          fs.readdirSync(bundledConfig).forEach(file => {
            if (file.endsWith(".json")) {
              fs.copyFileSync(
                path.join(bundledConfig, file),
                path.join(userDataConfig, file)
              );
            }
          });
          console.log("Config copiado a userData:", userDataConfig);
        }
      }

      return userDataConfig;
    }

    // En desarrollo: usa config/ del proyecto directamente
    return path.join(baseDir, "config");
  }

  const configDir = getConfigDir();
  console.log("Config dir resuelto:", configDir);

  //  Config I/O 
  ipcMain.handle("read-config", async (_, file) => {
    try {
      const p = path.join(configDir, `${file}.json`);
      return JSON.parse(fs.readFileSync(p, "utf8"));
    } catch (e) {
      return { error: String(e) };
    }
  });

  ipcMain.handle("write-config", async (_, file, data) => {
    try {
      const p = path.join(configDir, `${file}.json`);
      fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf8");
      return { ok: true };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  });

  //  File dialogs 
  ipcMain.handle("open-file", async (_, options) => {
    const res = await dialog.showOpenDialog({
      properties: ["openFile"],
      ...options
    });
    return res.canceled ? null : res.filePaths[0];
  });

  ipcMain.handle("open-exe", async () => {
    const res = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "Ejecutables", extensions: ["exe", "lnk", "bat"] }]
    });
    return res.canceled ? null : res.filePaths[0];
  });

  ipcMain.handle("open-image", async () => {
    const res = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "Imagenes", extensions: ["png", "jpg", "jpeg", "webp"] }]
    });
    return res.canceled ? null : res.filePaths[0];
  });

  //  Shell command (acciones del menu) 
  ipcMain.handle("exec-command", async (_, command) => {
    const { exec } = require("child_process");
    return new Promise((resolve) => {
      exec(command, (err) => {
        resolve({ ok: !err, error: err ? String(err) : null });
      });
    });
  });

  // Retorna la ruta resuelta para que main-launcher la use en el watcher
  return configDir;
};
