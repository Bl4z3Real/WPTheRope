# Cut the Rope - Android (WebView, 9:16)

Il gioco HTML5 sta in `app/src/main/assets/www`. L'app lo carica in una WebView a schermo intero,
bloccata in verticale (9:16). Lo stage di gioco (1024x576) viene scalato automaticamente per stare nello schermo.

## Compilare con GitHub Actions
1. Carica tutto il contenuto di questa cartella in un repository GitHub (branch `main`).
2. Vai su **Actions → Build Android APK** (parte da solo a ogni push, oppure **Run workflow**).
3. A fine build scarica l'APK da **Artifacts** (`CutTheRope-release-apk` o `CutTheRope-debug-apk`).

## Orientamento
In `app/src/main/AndroidManifest.xml` c'e' `android:screenOrientation="portrait"`.
Per giocare in orizzontale (campo di gioco a tutto schermo) usa `sensorLandscape`.
