import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
const root = path.resolve("build/web-mobile"),
  port = Number(process.env.PORT || 4190);
if (!existsSync(path.join(root, "index.html")))
  throw new Error("Missing Cocos Web build. Run npm run build:web first.");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".css": "text/css",
  ".wasm": "application/wasm",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};
const server = createServer((req, res) => {
  try {
    const url = new URL(req.url, "http://127.0.0.1");
    if (url.pathname === "/favicon.ico") {
      res.writeHead(204);
      res.end();
      return;
    }
    const file = path.resolve(
      root,
      decodeURIComponent(url.pathname).replace(/^\//, "") || "index.html",
    );
    if (!file.startsWith(root + path.sep) && file !== root) {
      res.writeHead(403);
      res.end();
      return;
    }
    if (!existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(readFileSync(file));
  } catch {
    res.writeHead(400);
    res.end("Bad request");
  }
});
function openBrowser() {
  spawn("powershell.exe", ["-NoProfile", "-Command", `Start-Process 'http://127.0.0.1:${port}'`], {
    windowsHide: true, stdio: "ignore",
  });
}
server.on("error", (e) => {
  if (e.code === "EADDRINUSE" && process.argv.includes("--open")) {
    console.log(`Preview port ${port} is already in use; opening the existing preview.`);
    openBrowser();
    return;
  }
  console.error("Preview server:", e.message);
  process.exitCode = 1;
});
server.listen(port, "127.0.0.1", () => {
  const url = `http://127.0.0.1:${port}`;
  console.log(`Cocos Web preview: ${url}`);
  if (process.argv.includes("--open")) openBrowser();
});
