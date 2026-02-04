const registerConfigIPC = require("./ipc-config");
const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 1000,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(__dirname, "public", "configurator", "index.html"));
}

app.whenReady().then(() => {
  registerConfigIPC(__dirname);
  createWindow();
});

app.on("window-all-closed", () => {
  app.quit();
});
