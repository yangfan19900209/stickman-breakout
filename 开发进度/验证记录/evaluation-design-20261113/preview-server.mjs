import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const root = new URL("../../", import.meta.url);
const allowed = new Map([
  ["/doc/prototypes/wechat-evaluation.html", "text/html; charset=utf-8"],
  ["/doc/WECHAT-EVALUATION-PLAN.md", "text/plain; charset=utf-8"],
  ["/assets/landart/title-cover.jpg", "image/jpeg"],
  ["/reports/v103-mobile-ending-settlement.png", "image/png"],
]);
createServer(async (req, res) => {
  const name = new URL(req.url, "http://127.0.0.1").pathname;
  if (!allowed.has(name)) {
    res.writeHead(404);
    res.end();
    return;
  }
  try {
    const data = await readFile(fileURLToPath(new URL(name.slice(1), root)));
    res.writeHead(200, {
      "Content-Type": allowed.get(name),
      "Cache-Control": "no-store",
    });
    res.end(data);
  } catch {
    res.writeHead(500);
    res.end("Preview unavailable");
  }
}).listen(4207, "127.0.0.1", () =>
  console.log(
    "Design preview ready: http://127.0.0.1:4207/doc/prototypes/wechat-evaluation.html",
  ),
);
