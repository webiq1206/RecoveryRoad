# Android release QA

Run on a **production** Android build (`eas build -p android --profile production`), not the Expo dev client.

## Android 15+ edge-to-edge

Expo SDK 58 targets Android 16 (API 36) with **edge-to-edge** via React Native (no `react-native-edge-to-edge`). System bars are transparent; app content must respect safe areas. Status appearance uses `expo-status-bar` only (no bar color APIs).

### Pre-release checks

1. **Status bar icons** — Dark screens show **light** status bar icons (readable on `#0D1B2A` background).
2. **Tab bar** — Bottom tabs are not clipped by gesture navigation or 3-button nav.
3. **Onboarding footer** — Pinned footer clears the navigation bar when the keyboard is closed.
4. **Modals** — Full-screen modals (crisis, stage transition) do not draw critical controls under system bars.
5. **Paywall / Premium** — RevenueCat hosted paywall and Settings subscription flows still work after dependency updates.

## Android 16 large screens (tablets / foldables)

The app no longer declares a global portrait lock in the manifest. **Phones** stay portrait via runtime lock (`expo-screen-orientation`); **large screens** (shortest side ≥ 600dp) can rotate and resize per Android 16 policy.

### Pre-release checks

1. **Phone** — App remains portrait-only in normal use.
2. **Tablet / foldable emulator** — Core flows (onboarding, Today hub, check-in, Settings) render without clipped headers, tab bar, or pinned footers.
3. **Play Console** — Pre-launch report should no longer list `MainActivity` or ML Kit scanner activities with `screenOrientation="portrait"`.

### Play Console deprecation warnings

After uploading a production AAB, review **Pre-launch report → Android 15 compatibility**.

| Source | Expected after this release |
|--------|----------------------------|
| `com.zoontek.rnedgetoedge.*` | Should **not** appear (dependency removed) |
| `com.swmansion.rnscreens.ScreenWindowTraits.*` | Reduced or eliminated (`react-native-screens` 4.24.0+) |
| `expo.modules.devlauncher.*` | Should **not** appear in production builds |
| `com.facebook.react.modules.statusbar.*` / `WindowUtilKt.*` | May persist until React Native upstream patch |
| `com.google.android.material.*` (BottomSheet) | May persist from Material / paywall UI dependencies |

If RN or Material warnings remain but UI is correct, treat as **informational** and track Expo SDK release notes for full clearance.

## DEX code optimization (Play Console)

Play requires **≥25%** obfuscation (and usually shrinking/optimization) when DEX is over ~10 MB. A score around **2%** almost always means the scored AAB did not run R8, or Play fell back to DEX heuristics (no `r8.json` / mapping).

Release builds force R8 via `expo-build-properties` + `plugins/withAndroidR8Optimization.js` (`minifyEnabled true`, `proguard-android-optimize.txt`, R8 full mode).

### Measured on production AAB (versionCode 13)

From `BUNDLE-METADATA/com.android.tools/r8.json` (what Play reads):

| Metric | Approx. score | Notes |
|--------|---------------|--------|
| Obfuscation | ~73% | Clears 25% (`noObfuscationPercentage` ≈ 27%) |
| Shrinking | ~73% | Clears 25% |
| Optimization | ~0% | RN/library keep rules leave little bytecode eligible; track Expo/RN upstream |

### Verify before trusting Play’s number

1. Build/upload a **new** production AAB. Older store versions keep the old score.
2. In **App bundle explorer**, open that versionCode and confirm the three percentages.
3. Or inspect the AAB:

```bash
tar -xOf your.aab BUNDLE-METADATA/com.android.tools/r8.json
```

If `r8.json` is missing, minify did not run for that artifact.

### Build and verify (edge-to-edge + DEX)

```bash
eas build -p android --profile production
```

Upload to **internal testing**, then check Pre-launch (Android 15) and App bundle explorer (DEX optimization).
