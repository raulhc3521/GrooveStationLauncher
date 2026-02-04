# ─── Sobrescribe la carpeta de instalación ────────────────────
# Electron-builder genera: $ProgramFilesFolder\GrooveStation\GrooveStation
# Esta función se ejecuta DESPUÉS de que NSIS setea InstallDir,
# así que nuestra línea la sobrescribe con la ruta plana.
Function .onGuiInit
  StrCpy $INSTDIR "$ProgramFilesFolder\GrooveStation"
FunctionEnd

# ─── Variables para opciones ───────────────────────────────────
Var Dialog
Var AutoStartCheckbox
Var AutoStartState
Var DisableShellCheckbox
Var DisableShellState

# ─── Página personalizada de opciones ─────────────────────────
Function CustomOptionsPage
  !insertmacro MUI_HEADER_TEXT "Opciones de GrooveStation" "Configure las opciones del launcher"
  
  nsDialogs::Create 1018
  Pop $Dialog
  
  ${If} $Dialog == error
    Abort
  ${EndIf}
  
  ${NSD_CreateCheckbox} 10 10 100% 12u "Iniciar GrooveStation automáticamente con Windows"
  Pop $AutoStartCheckbox
  ${NSD_SetState} $AutoStartCheckbox ${BST_UNCHECKED}
  
  ${NSD_CreateCheckbox} 10 30 100% 12u "Desactivar interfaz de Windows (Explorer) al iniciar GrooveStation"
  Pop $DisableShellCheckbox
  ${NSD_SetState} $DisableShellCheckbox ${BST_UNCHECKED}
  
  ${NSD_CreateLabel} 10 55 100% 40u "Nota: Estas opciones pueden ser cambiadas posteriormente desde el Configurador de GrooveStation.$\n$\nLa opción 'Desactivar interfaz' oculta la barra de tareas y el escritorio mientras GrooveStation está activo."
  
  nsDialogs::Show
FunctionEnd

Function CustomOptionsPageLeave
  ${NSD_GetState} $AutoStartCheckbox $AutoStartState
  ${NSD_GetState} $DisableShellCheckbox $DisableShellState
FunctionEnd

# ─── Accesos directos (después de instalar) ───────────────────
!macro customInstall
  # Escritorio
  CreateShortCut "$DESKTOP\GrooveStation Launcher.lnk" "$INSTDIR\GrooveStation.exe" ""         "$INSTDIR\GrooveStation.exe" 0
  CreateShortCut "$DESKTOP\GrooveStation Config.lnk"   "$INSTDIR\GrooveStation.exe" "--config" "$INSTDIR\GrooveStation.exe" 0

  # Menú inicio
  CreateDirectory "$SMPROGRAMS\GrooveStation"
  CreateShortCut "$SMPROGRAMS\GrooveStation\GrooveStation Launcher.lnk" "$INSTDIR\GrooveStation.exe" ""         "$INSTDIR\GrooveStation.exe" 0
  CreateShortCut "$SMPROGRAMS\GrooveStation\GrooveStation Config.lnk"   "$INSTDIR\GrooveStation.exe" "--config" "$INSTDIR\GrooveStation.exe" 0
  CreateShortCut "$SMPROGRAMS\GrooveStation\Desinstalar.lnk"            "$INSTDIR\Uninstall GrooveStation.exe"
  
  # Crear archivo de configuración de opciones del sistema
  ${If} $AutoStartState == ${BST_CHECKED}
    # Agregar al registro para auto-inicio
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "GrooveStation" '"$INSTDIR\GrooveStation.exe"'
    # Escribir en settings.json
    FileOpen $0 "$INSTDIR\resources\settings.json" w
    FileWrite $0 '{"autoStart": true, "disableShell": '
    ${If} $DisableShellState == ${BST_CHECKED}
      FileWrite $0 'true}'
    ${Else}
      FileWrite $0 'false}'
    ${EndIf}
    FileClose $0
  ${Else}
    # No auto-inicio
    FileOpen $0 "$INSTDIR\resources\settings.json" w
    FileWrite $0 '{"autoStart": false, "disableShell": '
    ${If} $DisableShellState == ${BST_CHECKED}
      FileWrite $0 'true}'
    ${Else}
      FileWrite $0 'false}'
    ${EndIf}
    FileClose $0
  ${EndIf}
!macroend

# ─── Desinstalar ───────────────────────────────────────────────
!macro customUnInstall
  Delete "$DESKTOP\GrooveStation Launcher.lnk"
  Delete "$DESKTOP\GrooveStation Config.lnk"
  RMDir /r "$SMPROGRAMS\GrooveStation"
  
  # Eliminar auto-inicio del registro
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "GrooveStation"
  
  # Eliminar archivo de configuración
  Delete "$INSTDIR\resources\settings.json"
!macroend

# ─── Página de opciones en la instalación ─────────────────────
!macro customInit
  # Esta macro se ejecuta antes de mostrar las páginas
!macroend

# Insertar página de opciones antes de la instalación
!macro customInstallPage
  Page custom CustomOptionsPage CustomOptionsPageLeave
!macroend
