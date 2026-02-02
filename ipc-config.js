const { ipcMain, dialog } = require("electron");
const fs   = require("fs");
const path = require("path");

module.exports = function registerConfigIPC(baseDir) {
  const configDir = path.join(baseDir, "config");

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
      filters: [{ name: "Ejecutables", extensions: ["exe"] }]
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
};
