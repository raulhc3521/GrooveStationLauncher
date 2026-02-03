# 📦 Guía de Instalación - Arcade Launcher

## Pasos para generar el instalador

### 1️⃣ Preparación inicial

**Instala las dependencias:**
```bash
npm install
npm install --save-dev electron-builder
```

**Estructura de carpetas necesaria:**
```
arcade-launcher/
├── assets/              # Tus recursos (imágenes, sonidos, videos)
│   ├── images/
│   │   └── logo.png
│   ├── sounds/
│   └── music/
├── config/              # Archivos de configuración inicial
│   ├── games.json
│   ├── media.json
│   └── menu.json
├── build/               # Recursos del instalador
│   └── icon.ico        # ⚠️ CREAR ESTE ARCHIVO
├── public/
├── installer-scripts/
├── main.js
├── main-launcher.js
├── main-configurator.js
└── package.json
```

---

### 2️⃣ Crear el icono de la aplicación

**⚠️ PASO OBLIGATORIO**

1. **Prepara una imagen:**
   - PNG de al menos 512x512px
   - Fondo transparente
   - Diseño simple y reconocible

2. **Convierte a .ico:**
   - Usa https://www.icoconverter.com/
   - O usa https://convertio.co/png-ico/
   - O ImageMagick: `convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico`

3. **Guarda como `build/icon.ico`**

Sin este archivo, el instalador usará el icono por defecto de Electron.

---

### 3️⃣ Verificar configuración

**Edita `package.json` si es necesario:**

```json
{
  "name": "arcade-launcher",
  "version": "2.0.0",
  "description": "Arcade Game Launcher with Configuration Tool",
  "author": "TU NOMBRE AQUÍ",  // ← Cambia esto
  "build": {
    "appId": "com.tudominio.arcade-launcher",  // ← Opcional: cambia el ID
    "productName": "Arcade Launcher"
  }
}
```

**Verifica que existan estos archivos:**
- ✅ `config/games.json`
- ✅ `config/media.json`
- ✅ `config/menu.json`
- ✅ `LICENSE.txt`
- ✅ `build/icon.ico`

---

### 4️⃣ Generar el instalador

**Opción A - Instalador completo (recomendado):**
```bash
npm run build:win
```

**Opción B - Solo empaquetar (sin instalador):**
```bash
npm run pack
```

**Tiempo estimado:** 3-5 minutos en la primera ejecución.

---

### 5️⃣ Resultado

El instalador se creará en:
```
dist/
└── Arcade Launcher Setup 2.0.0.exe    # ← Este es tu instalador
```

**Tamaño aproximado:** 100-150 MB (incluye Electron runtime)

---

## 🎯 Qué incluye el instalador

### Archivos instalados:
```
C:\Program Files\Arcade Launcher\
├── Arcade Launcher.exe        # Ejecutable principal
├── resources/
│   └── app.asar              # Tu aplicación empaquetada
├── config/                   # Configuración inicial
│   ├── games.json
│   ├── media.json
│   └── menu.json
└── Uninstall Arcade Launcher.exe
```

### Accesos directos creados:

**En el Escritorio:**
- 🎮 Arcade Launcher (ejecuta el launcher)
- ⚙️ Arcade Config (ejecuta el configurador)

**En el Menú Inicio → Arcade Launcher:**
- Arcade Launcher
- Arcade Config
- Desinstalar

---

## ⚙️ Cómo funciona

### El usuario ejecuta desde 2 accesos directos:

**Launcher (gaming):**
```
Arcade Launcher.exe
```

**Configurador (setup):**
```
Arcade Launcher.exe --config
```

Internamente, `main.js` detecta el flag `--config` y carga:
- `main-launcher.js` → modo launcher
- `main-configurator.js` → modo configurador

---

## 🐛 Solución de problemas

### Error: "Application entry file not found"
- Verifica que `main.js` exista en la raíz
- Revisa que `package.json` tenga `"main": "main.js"`

### El icono no aparece
- Asegúrate de que `build/icon.ico` sea un .ico válido
- Debe tener múltiples tamaños (16, 32, 48, 64, 128, 256)

### electron-builder falla
```bash
# Limpia caché y reinstala
rm -rf node_modules dist
npm install
npm run build:win
```

### Instalador muy grande (>200 MB)
- Normal. Incluye Electron (~90 MB) + tu app + dependencias
- Para reducir: usa `asar` y optimiza assets

### Los accesos directos no funcionan
- Verifica `installer-scripts/custom-installer.nsh`
- Asegúrate de que el flag `--config` esté correctamente pasado

---

## 📝 Opciones avanzadas

### Cambiar el directorio de instalación por defecto
Edita `package.json`:
```json
"nsis": {
  "installerLanguages": ["es"],
  "perMachine": true,
  "allowToChangeInstallationDirectory": true
}
```

### Firma de código (code signing)
```json
"win": {
  "certificateFile": "path/to/cert.pfx",
  "certificatePassword": "password",
  "signingHashAlgorithms": ["sha256"]
}
```

### Actualización automática
```json
"publish": {
  "provider": "github",
  "owner": "tu-usuario",
  "repo": "arcade-launcher"
}
```

---

## 🚀 Distribución

### Subir a Google Drive / Dropbox:
1. Sube `Arcade Launcher Setup 2.0.0.exe`
2. Comparte el link

### Hosting propio:
```bash
# Servidor simple
python -m http.server 8000
# Descarga desde: http://tu-ip:8000/dist/
```

### GitHub Releases:
1. Crea un release en GitHub
2. Sube el .exe como asset
3. Los usuarios descargan desde Releases

---

## 📋 Checklist final

Antes de distribuir:

- [ ] Icono personalizado creado (`build/icon.ico`)
- [ ] Versión actualizada en `package.json`
- [ ] Autor y descripción correctos
- [ ] Configuración inicial en `config/` funcional
- [ ] Assets necesarios en `assets/`
- [ ] Instalador generado sin errores
- [ ] Probado en una máquina limpia
- [ ] Ambos accesos directos funcionan
- [ ] Desinstalador funciona correctamente

---

## 🎨 Personalización del instalador

### Cambiar imágenes del instalador:

Crea en `build/`:
- `installerHeader.bmp` (150x57px)
- `installerSidebar.bmp` (164x314px)

Agrega a `package.json`:
```json
"nsis": {
  "installerHeader": "build/installerHeader.bmp",
  "installerSidebar": "build/installerSidebar.bmp"
}
```

### Mensajes personalizados:

```json
"nsis": {
  "warningsAsErrors": false,
  "deleteAppDataOnUninstall": false,
  "displayLanguageSelector": true
}
```

---

## 📞 Soporte

Si encuentras errores durante el proceso de build:

1. Verifica los logs en `dist/builder-debug.yml`
2. Ejecuta con verbose: `DEBUG=electron-builder npm run build:win`
3. Revisa la documentación: https://www.electron.build/

---

**¡Listo!** 🎉 Tu instalador profesional de Arcade Launcher está completo.
