; OpenMD NSIS Installer Hooks
; Provides optional file association for .md and .markdown files
; Note: FileAssociation.nsh is already included by Tauri's generated NSIS script

; Called after the main install section completes
Function customInstall
  MessageBox MB_ICONQUESTION|MB_YESNO "Do you want to associate .md and .markdown files with OpenMD?$\n$\nThis lets you open Markdown files directly with OpenMD from File Explorer and the 'Open with' menu." IDNO done
    !insertmacro APP_ASSOCIATE "md" "OpenMD.md" "Markdown File" "$INSTDIR\${MAINBINARYNAME}.exe,0" "Open with OpenMD" '"$INSTDIR\${MAINBINARYNAME}.exe" "%1"'
    !insertmacro APP_ASSOCIATE "markdown" "OpenMD.markdown" "Markdown File" "$INSTDIR\${MAINBINARYNAME}.exe,0" "Open with OpenMD" '"$INSTDIR\${MAINBINARYNAME}.exe" "%1"'
    System::Call 'Shell32::SHChangeNotify(i 0x08000000, i 0, p 0, p 0)'
  done:
FunctionEnd

; Called during uninstall — always clean up associations regardless
Function customUninstall
  !insertmacro APP_UNASSOCIATE "md" "OpenMD.md"
  !insertmacro APP_UNASSOCIATE "markdown" "OpenMD.markdown"
FunctionEnd
