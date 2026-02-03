!macro customInstall
  # Crear acceso directo al Launcher en el escritorio
  CreateShortCut "$DESKTOP\Arcade Launcher.lnk" "$INSTDIR\Arcade Launcher.exe" "" "$INSTDIR\Arcade Launcher.exe" 0
  
  # Crear acceso directo al Configurador en el escritorio
  CreateShortCut "$DESKTOP\Arcade Config.lnk" "$INSTDIR\Arcade Launcher.exe" "--config" "$INSTDIR\Arcade Launcher.exe" 0
  
  # Crear accesos en el menú inicio
  CreateDirectory "$SMPROGRAMS\Arcade Launcher"
  CreateShortCut "$SMPROGRAMS\Arcade Launcher\Arcade Launcher.lnk" "$INSTDIR\Arcade Launcher.exe" "" "$INSTDIR\Arcade Launcher.exe" 0
  CreateShortCut "$SMPROGRAMS\Arcade Launcher\Arcade Config.lnk" "$INSTDIR\Arcade Launcher.exe" "--config" "$INSTDIR\Arcade Launcher.exe" 0
  CreateShortCut "$SMPROGRAMS\Arcade Launcher\Desinstalar.lnk" "$INSTDIR\Uninstall Arcade Launcher.exe"
!macroend

!macro customUnInstall
  # Eliminar accesos directos del escritorio
  Delete "$DESKTOP\Arcade Launcher.lnk"
  Delete "$DESKTOP\Arcade Config.lnk"
  
  # Eliminar carpeta del menú inicio
  RMDir /r "$SMPROGRAMS\Arcade Launcher"
!macroend
