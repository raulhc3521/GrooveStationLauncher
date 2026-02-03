// MAIN WRAPPER - Detecta el modo según argumentos

const { app } = require("electron");
const path = require("path");

// Detectar modo desde argumentos de línea de comando
const args = process.argv.slice(1);
const isConfig = args.includes("--config");

if (isConfig) {
  // Modo configurador
  console.log("Iniciando en modo CONFIGURADOR");
  require("./main-configurator.js");
} else {
  // Modo launcher (por defecto)
  console.log("Iniciando en modo LAUNCHER");
  require("./main-launcher.js");
}
