# Accesos directos (después de instalar) 

!macro customInstall
  !define MUI_FINISHPAGE_BITMAP "build/installer-sidebar.bmp"
  # Escritorio
  CreateShortCut "$DESKTOP\GrooveStation Config.lnk" "$INSTDIR\GrooveStation.exe" "--config" "$INSTDIR\resources\icon-config.ico" 0

  # Menú inicio
  CreateDirectory "$SMPROGRAMS\GrooveStation"
  CreateShortCut "$SMPROGRAMS\GrooveStation\GrooveStation Config.lnk"   "$INSTDIR\GrooveStation.exe" "--config" "$INSTDIR\resources\icon-config.ico" 0
  CreateShortCut "$SMPROGRAMS\GrooveStation\Desinstalar.lnk"            "$INSTDIR\Uninstall GrooveStation.exe"
  
  # Crear settings.json por defecto
  FileOpen $0 "$INSTDIR\resources\settings.json" w
  FileWrite $0 '{"autoStart": false, "disableShell": false}'
  FileClose $0
!macroend

# Configuración de página final
!macro customHeader
  !define MUI_FINISHPAGE_RUN '"$INSTDIR\GrooveStation.exe" --config'
  !define MUI_FINISHPAGE_RUN_TEXT "Abrir Configurador"
  !define MUI_FINISHPAGE_RUN_NOTCHECKED
!macroend

# Desinstalar
!macro customUnInstall
  Delete "$DESKTOP\GrooveStation Launcher.lnk"
  Delete "$DESKTOP\GrooveStation Config.lnk"
  RMDir /r "$SMPROGRAMS\GrooveStation"
  
  # Eliminar auto-inicio del registro
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "GrooveStation"
  
  # Eliminar archivo de configuración
  Delete "$INSTDIR\resources\settings.json"

  # NUEVO: Eliminar carpeta de AppData
  RMDir /r "$APPDATA\groovestation-launcher"
!macroend




