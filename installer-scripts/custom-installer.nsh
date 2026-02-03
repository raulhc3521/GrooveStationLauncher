!macro customInstall
  # Escritorio: Launcher
  CreateShortCut "$DESKTOP\GrooveStation.lnk" "$INSTDIR\GrooveStation.exe" "" "$INSTDIR\GrooveStation.exe" 0

  # Escritorio: Configurador
  CreateShortCut "$DESKTOP\GrooveStation Config.lnk" "$INSTDIR\GrooveStation.exe" "--config" "$INSTDIR\GrooveStation.exe" 0

  # Menú inicio
  CreateDirectory "$SMPROGRAMS\GrooveStation"
  CreateShortCut "$SMPROGRAMS\GrooveStation\GrooveStation.lnk" "$INSTDIR\GrooveStation.exe" "" "$INSTDIR\GrooveStation.exe" 0
  CreateShortCut "$SMPROGRAMS\GrooveStation\GrooveStation Config.lnk" "$INSTDIR\GrooveStation.exe" "--config" "$INSTDIR\GrooveStation.exe" 0
  CreateShortCut "$SMPROGRAMS\GrooveStation\Desinstalar.lnk" "$INSTDIR\Uninstall GrooveStation.exe"
!macroend

!macro customUnInstall
  Delete "$DESKTOP\GrooveStation.lnk"
  Delete "$DESKTOP\GrooveStation Config.lnk"
  RMDir /r "$SMPROGRAMS\GrooveStation"
!macroend
