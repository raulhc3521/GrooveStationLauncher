const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  // Acciones del launcher
  launchGame:  (exePath, args = []) => ipcRenderer.invoke("launch-game", exePath, args),
  exitApp:     ()                   => ipcRenderer.send("exit-app"),
  execCommand: (command)            => ipcRenderer.invoke("exec-command", command),

  // Lectura / escritura de config
  readConfig:  (file)       => ipcRenderer.invoke("read-config",  file),
  writeConfig: (file, data) => ipcRenderer.invoke("write-config", file, data),

  // Dialogos de archivo
  openFile:  (options) => ipcRenderer.invoke("open-file",  options),
  openExe:   ()        => ipcRenderer.invoke("open-exe"),
  openImage: ()        => ipcRenderer.invoke("open-image"),

  // Eventos de ventana
  onLauncherFocus:  (cb) => ipcRenderer.on("launcher-focus",  cb),
  onLauncherBlur:   (cb) => ipcRenderer.on("launcher-blur",   cb),
  onConfigChanged:  (cb) => ipcRenderer.on("config-changed",  cb)
});
