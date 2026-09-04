/**
 * Phone cameras (iOS Camera, Google Lens) report "No usable data found" for Expo
 * development-client QR codes because they encode exp+slug:// — a custom scheme
 * the camera will not open. Serve an http(s) chooser cameras CAN scan.
 *
 * Do not auto-redirect to custom schemes: Chrome/Safari then show
 * "Unable to open the app" / "Something went wrong" when the matching app is missing.
 */
const os = require("node:os");

const OPEN_PATH = "/open-dev-client";
const APP_SCHEME = "recoveryroad";
const DEV_CLIENT_SCHEME = "exp+recovery-road";
const ANDROID_PACKAGE = "com.webiq.recoveryroad";
const EXPO_GO_PACKAGE = "host.exp.exponent";

function metroPort() {
  const raw = process.env.RCT_METRO_PORT || process.env.EXPO_METRO_PORT || "8081";
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 8081;
}

function lanIPv4() {
  const fromEnv = process.env.REACT_NATIVE_PACKAGER_HOSTNAME?.trim();
  if (fromEnv && /^\d{1,3}(\.\d{1,3}){3}$/.test(fromEnv)) return fromEnv;

  const nets = os.networkInterfaces();
  const scored = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] ?? []) {
      const v4 = net.family === "IPv4" || net.family === 4;
      if (!v4 || net.internal) continue;
      const address = net.address;
      if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(address)) continue;
      let score = 10;
      if (/virtual|vethernet|vmware|vbox|hyper-v|wsl|docker|tun|tap|vpn/i.test(name)) {
        score = 0;
      } else if (address.startsWith("192.168.")) score = 100;
      else if (address.startsWith("10.")) score = 90;
      else if (address.startsWith("169.254.")) score = 1;
      scored.push({ address, score });
    }
  }
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.address ?? null;
}

function cameraFriendlyUrl() {
  const host = lanIPv4();
  const port = metroPort();
  if (!host) return `http://localhost:${port}${OPEN_PATH}`;
  return `http://${host}:${port}${OPEN_PATH}`;
}

function packagerUrlFromRequest(req) {
  const hostHeader = req.headers.host;
  if (hostHeader && !hostHeader.startsWith("localhost") && !hostHeader.startsWith("127.0.0.1")) {
    const proto = req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
    return `${proto}://${hostHeader}`;
  }
  const host = lanIPv4();
  const port = metroPort();
  return host ? `http://${host}:${port}` : `http://127.0.0.1:${port}`;
}

function expoGoUrl(packagerUrl) {
  const u = new URL(packagerUrl);
  if (u.hostname.includes("exp.direct") || u.hostname.includes("exp.host")) {
    return packagerUrl.replace(/^https:/i, "exps:").replace(/^http:/i, "exp:");
  }
  const port = u.port || (u.protocol === "https:" ? "443" : "80");
  return `exp://${u.hostname}:${port}`;
}

function androidIntent(scheme, hostAndPath, pkg, fallbackUrl) {
  const fallback = `S.browser_fallback_url=${encodeURIComponent(fallbackUrl)}`;
  return `intent://${hostAndPath}#Intent;scheme=${scheme};package=${pkg};${fallback};end`;
}

function deepLinks(packagerUrl, chooserUrl) {
  const encoded = encodeURIComponent(packagerUrl);
  const devPath = `expo-development-client/?url=${encoded}`;
  const expoGo = expoGoUrl(packagerUrl);
  const expPlus = `${DEV_CLIENT_SCHEME}://${devPath}`;
  const appScheme = `${APP_SCHEME}://${devPath}`;
  const fallback = chooserUrl || packagerUrl + OPEN_PATH;
  return {
    expoGo,
    expoGoIntent: androidIntent("exp", `${new URL(packagerUrl).host}/`, EXPO_GO_PACKAGE, fallback),
    expPlus,
    appScheme,
    intent: androidIntent(DEV_CLIENT_SCHEME, devPath, ANDROID_PACKAGE, fallback),
    appIntent: androidIntent(APP_SCHEME, devPath, ANDROID_PACKAGE, fallback),
    packagerUrl,
  };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

function htmlPage(packagerUrl, chooserUrl) {
  const links = deepLinks(packagerUrl, chooserUrl);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Open RecoveryRoad</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0a0f1a; color: #e8eef8; margin: 0; padding: 24px; max-width: 440px; }
    h1 { font-size: 22px; margin: 0 0 8px; }
    p, li { line-height: 1.45; color: #c5cdd8; }
    a.btn { display: block; text-align: center; text-decoration: none; color: #0a0f1a; background: #7C8CF8; font-weight: 700; padding: 14px 16px; border-radius: 12px; margin: 12px 0; }
    a.btn.secondary { background: #1c2433; color: #e8eef8; border: 1px solid #3a4558; }
    code { font-size: 13px; word-break: break-all; color: #9aa8bd; }
  </style>
</head>
<body>
  <h1>Open RecoveryRoad</h1>
  <p><strong>Expo Go cannot load a development-build server.</strong> If the phone said “There was a problem running the requested app”, Metro is still in development-build mode.</p>
  <p>On the computer terminal, press <strong>s</strong> until it says <strong>Using Expo Go</strong>. Then tap the first button. Or restart with <code>npx expo start --go</code>.</p>
  <a class="btn" id="expo-go" href="${escapeHtml(links.expoGo)}">Open in Expo Go</a>
  <a class="btn secondary" id="dev-client" href="${escapeHtml(links.expPlus)}">Open RecoveryRoad development build</a>
  <a class="btn secondary" id="app-scheme" href="${escapeHtml(links.appScheme)}">Open via recoveryroad://</a>
  <p>Metro: <code>${escapeHtml(links.packagerUrl)}</code></p>
  <ul>
    <li>Expo Go: terminal must say Using Expo Go. Same Wi‑Fi as this PC.</li>
    <li>Development build: install the EAS RecoveryRoad <strong>dev client</strong>, not the store app.</li>
    <li>Subscriptions are disabled in Expo Go (no RevenueCat native module).</li>
  </ul>
  <script>
    var links = ${JSON.stringify(links)};
    var ua = navigator.userAgent || "";
    var android = /Android/i.test(ua);
    if (android) {
      document.getElementById("expo-go").href = links.expoGoIntent;
      document.getElementById("dev-client").href = links.intent;
      document.getElementById("app-scheme").href = links.appIntent;
    }
  </script>
</body>
</html>`;
}

function isOpenDevClientRequest(req) {
  const url = req.url || "";
  const pathname = url.split("?")[0];
  return pathname === OPEN_PATH || pathname === `${OPEN_PATH}/`;
}

function serveOpenDevClient(req, res) {
  const packagerUrl = packagerUrlFromRequest(req);
  const hostHeader = req.headers.host;
  const proto = req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
  const chooserUrl = hostHeader ? `${proto}://${hostHeader}${OPEN_PATH}` : cameraFriendlyUrl();
  const body = htmlPage(packagerUrl, chooserUrl);
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(body);
  console.log(`[open-dev-client] served chooser for ${packagerUrl}`);
}

let printed = false;

function printCameraQrOnce() {
  if (printed) return;
  printed = true;
  const url = cameraFriendlyUrl();
  console.log("");
  console.log("Phone camera QR (opens a chooser; does not auto-launch an app):");
  console.log(`  ${url}`);
  try {
    const qrcode = require("qrcode-terminal");
    qrcode.generate(url, { small: true });
  } catch {
    // qrcode-terminal is optional; the URL above is enough to type or scan elsewhere.
  }
  console.log("On the phone, tap Open in Expo Go only after this terminal says Using Expo Go.");
  console.log("If it says Using development build, press s here first, then tap the button again.");
  console.log("Or restart with: npx expo start --go");
  console.log("");
}

function enhanceWithDevClientCameraBridge(middleware) {
  printCameraQrOnce();
  return (req, res, next) => {
    if (isOpenDevClientRequest(req)) {
      serveOpenDevClient(req, res);
      return;
    }
    return middleware(req, res, next);
  };
}

module.exports = {
  OPEN_PATH,
  enhanceWithDevClientCameraBridge,
  cameraFriendlyUrl,
  deepLinks,
  expoGoUrl,
  htmlPage,
};
