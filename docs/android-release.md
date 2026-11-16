# Android (Capacitor)

- Build web + sync: `npm run cap:sync`; open in Android Studio: `npm run cap:open`.
- Icons/splash: `node scripts/make-android-assets.mjs && npx capacitor-assets generate --android` (sources in `assets/`, output committed under `android/`).
- Release signing (CI, Task 16): set `ANDROID_KEYSTORE_PATH`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`; version via `APP_VERSION_NAME` / `APP_VERSION_CODE`. Without them the release build is unsigned. Never commit keystores.
- Receipt camera/gallery uses `<input type=file capture>`; Capacitor's WebView handles the chooser, no plugin. Add `android.permission.CAMERA` only if a device test shows the camera intent failing.
