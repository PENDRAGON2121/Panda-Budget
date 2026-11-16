# Android (Capacitor)

- Build web + sync: `npm run cap:sync`; open in Android Studio: `npm run cap:open`.
- Icons/splash: `node scripts/make-android-assets.mjs && npx capacitor-assets generate --android` (sources in `assets/`, output committed under `android/`).
- Release signing (CI, Task 16): set `ANDROID_KEYSTORE_PATH`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`; version via `APP_VERSION_NAME` / `APP_VERSION_CODE`. Without them the release build is unsigned. Never commit keystores.
- Receipt camera/gallery uses `<input type=file capture>`; Capacitor's WebView handles the chooser, no plugin. Add `android.permission.CAMERA` only if a device test shows the camera intent failing.

## CI release (GitHub Actions)

Workflow: `.github/workflows/android.yml` (push to `main`, `v*` tags, PRs, manual dispatch). It runs tests, type-check, build, `cap sync`, then builds the APK.

- **With signing secrets:** builds a signed `assembleRelease` and uploads `panda-wallet-v<version>.apk` as an artifact. On a `v*` tag it also publishes a GitHub Release with that APK and the matching `CHANGELOG.md` section as notes.
- **Without secrets** (fork PRs, or before you add them): builds `assembleDebug`, uploads `panda-wallet-v<version>-debug.apk` and emits a `::warning::`. The run does not fail.
- On a `v*` tag, the run fails if the tag differs from `v<package.json version>`.

### 1. Generate the keystore (once, keep it safe and backed up)

```
keytool -genkeypair -v -keystore panda-wallet-release.jks -alias pandawallet -keyalg RSA -keysize 2048 -validity 10000
```

Never commit it (`*.jks` is git-ignored). Losing it means you cannot update installed apps.

### 2. Base64-encode it

PowerShell:
```
[Convert]::ToBase64String([IO.File]::ReadAllBytes("panda-wallet-release.jks")) | Set-Clipboard
```
bash:
```
base64 -w0 panda-wallet-release.jks
```

### 3. Add the repo secrets

Settings -> Secrets and variables -> Actions -> New repository secret:

| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | the base64 text from step 2 |
| `ANDROID_KEYSTORE_PASSWORD` | the keystore password you chose |
| `ANDROID_KEY_ALIAS` | `pandawallet` |
| `ANDROID_KEY_PASSWORD` | the key password you chose |

### Release procedure

1. Bump `version` in `package.json` (semantic versioning; `versionCode` = `major*10000 + minor*100 + patch`, minor/patch <= 99).
2. Add a `## [X.Y.Z] - YYYY-MM-DD` section to `CHANGELOG.md`.
3. Commit and push to `main`.
4. `git tag v0.0.2 && git push --tags` (tag must equal `v` + package version).

CI then publishes the signed APK to a GitHub Release using that changelog section as notes.
