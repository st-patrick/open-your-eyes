/**
 * take-screenshots.ts — capture homepage screenshots for every project
 * listed in dashboard/public/snapshot.json (launched + liveSubdomains).
 *
 * USES REAL CHROME VIA CDP, NOT HEADLESS PUPPETEER.
 *
 * Why: headless Chrome silently disagrees with real Chrome on fonts,
 * WebGL, codec availability, and some fetch/CORS edge cases. Sites that
 * look fine in the user's browser render broken in `headless: true`.
 * The fix is to launch the actual Chrome.app they use every day with
 * --remote-debugging-port and connect to it via the DevTools Protocol.
 * Puppeteer then drives the real browser instead of its own bundled one.
 *
 * The spawned Chrome gets its own --user-data-dir so it does NOT touch
 * the everyday Chrome profile (no cookies, no history pollution, no
 * "Chrome is already running" conflict). It runs with the window off-
 * screen to stay out of the way, and we kill it cleanly at the end.
 *
 * URL list comes from snapshot.json's `launched` and `liveSubdomains`
 * arrays, which the dashboard itself reads from. That makes this script
 * generic for any user — your projects, not the script author's.
 *
 * See ~/.introdote/PLAYBOOK.md → "RULE: REAL CHROME VIA CDP".
 */

import puppeteer, { type Browser } from "puppeteer-core";
import { spawn, type ChildProcess } from "child_process";
import { mkdtempSync, rmSync, mkdirSync, readFileSync } from "fs";
import { tmpdir, platform } from "os";
import path from "path";
import net from "net";

/** Resolve the Chrome binary for the current OS. */
function resolveChromeBinary(): string {
  if (process.env.CHROME_BINARY) return process.env.CHROME_BINARY;
  switch (platform()) {
    case "darwin":
      return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    case "win32":
      return "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
    default:
      return "/usr/bin/google-chrome-stable";
  }
}

const CHROME_BIN = resolveChromeBinary();
const DEBUG_PORT = 9222;
const VIEWPORT = { width: 1280, height: 800, deviceScaleFactor: 2 };
const NAV_TIMEOUT_MS = 15_000;
const SETTLE_MS = 1_500;

const outDir = path.join(import.meta.dirname, "public", "screenshots");
mkdirSync(outDir, { recursive: true });

/** Slugify a project name to a safe file stem. */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Load the list of URLs to screenshot from snapshot.json. */
interface SnapshotEntry { name?: string; url?: string }
interface Snapshot { launched?: SnapshotEntry[]; liveSubdomains?: SnapshotEntry[] }

function loadUrls(): { name: string; url: string }[] {
  const snapshotPath = path.join(import.meta.dirname, "public", "snapshot.json");
  let snapshot: Snapshot = {};
  try {
    snapshot = JSON.parse(readFileSync(snapshotPath, "utf-8"));
  } catch {
    console.warn("! could not read snapshot.json — no URLs to screenshot");
    return [];
  }
  const entries = [
    ...(snapshot.launched ?? []),
    ...(snapshot.liveSubdomains ?? []),
  ];
  return entries
    .filter((e): e is { name: string; url: string } => !!e.name && !!e.url)
    .map((e) => ({ name: slugify(e.name), url: e.url }));
}

/** Wait until TCP port is listening (Chrome's debug endpoint is up). */
function waitForPort(port: number, timeoutMs = 10_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      const sock = net.createConnection({ port, host: "127.0.0.1" });
      sock.once("connect", () => { sock.destroy(); resolve(); });
      sock.once("error", () => {
        sock.destroy();
        if (Date.now() > deadline) reject(new Error(`port ${port} never opened`));
        else setTimeout(tryConnect, 150);
      });
    };
    tryConnect();
  });
}

async function spawnChrome(): Promise<{ proc: ChildProcess; userDataDir: string }> {
  const userDataDir = mkdtempSync(path.join(tmpdir(), "introdote-chrome-"));
  const args = [
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${userDataDir}`,
    // Dedicated, out-of-the-way window — NOT headless. The whole point
    // is real rendering pipeline, real fonts, real codecs.
    "--window-position=9999,9999",
    "--window-size=1280,800",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--disable-default-apps",
    "--disable-extensions",
    "--disable-sync",
    "--metrics-recording-only",
    "--mute-audio",
    "--hide-crash-restore-bubble",
    "about:blank",
  ];
  const proc = spawn(CHROME_BIN, args, { stdio: ["ignore", "ignore", "pipe"], detached: false });
  proc.on("exit", (code) => {
    if (code && code !== 0) console.error(`Chrome exited with code ${code}`);
  });
  await waitForPort(DEBUG_PORT, 10_000);
  return { proc, userDataDir };
}

async function run() {
  const urls = loadUrls();
  if (urls.length === 0) {
    console.log("No URLs in snapshot.json's launched/liveSubdomains — nothing to screenshot.");
    console.log("Run `npm run snapshot` first, and add entries to the arrays in dashboard/public/snapshot.json.");
    return;
  }

  console.log(`→ Launching real Chrome with CDP on :${DEBUG_PORT}`);
  const { proc, userDataDir } = await spawnChrome();
  let browser: Browser | undefined;
  try {
    browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${DEBUG_PORT}` });
    const page = await browser.newPage();
    await page.setViewport(VIEWPORT);

    for (const { name, url } of urls) {
      const outFile = path.join(outDir, `${name}.webp`);
      try {
        await page.goto(url, { waitUntil: "networkidle2", timeout: NAV_TIMEOUT_MS });
        await new Promise((r) => setTimeout(r, SETTLE_MS));
        await page.screenshot({ path: outFile, type: "webp", quality: 80 });
        console.log(`  ✓ ${name}`);
      } catch (e) {
        console.log(`  ✗ ${name} — ${(e as Error).message.slice(0, 80)}`);
      }
    }
    await page.close();
  } finally {
    // disconnect, don't browser.close() — we own the lifecycle explicitly
    // via the spawned process, not via puppeteer.
    if (browser) await browser.disconnect();
    proc.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 500));
    if (!proc.killed) proc.kill("SIGKILL");
    try { rmSync(userDataDir, { recursive: true, force: true }); } catch {}
  }

  console.log(`\nDone. ${urls.length} screenshots in ${outDir}`);
}

run().catch((e) => {
  console.error("fatal:", e);
  process.exit(1);
});
