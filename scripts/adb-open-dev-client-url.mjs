/**
 * When QR / "Open link" fails on Android, open the dev session via adb (USB debugging).
 * Copy the launch URL from the Expo terminal. SDK 58 prints:
 *   recoveryroad://?__expo_url=...
 * Legacy form still works:
 *   exp+recoveryroad://expo-development-client/?url=...
 *
 *   npm run android:open-dev-url -- "recoveryroad://?__expo_url=..."
 */
import { spawn } from "node:child_process";

const url = process.argv[2];
if (!url || !url.includes("://")) {
  console.error(
    'Usage: npm run android:open-dev-url -- "recoveryroad://?__expo_url=..."',
  );
  process.exit(1);
}

const child = spawn(
  "adb",
  ["shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", url],
  { stdio: "inherit" },
);

child.on("exit", (code) => process.exit(code ?? 1));
