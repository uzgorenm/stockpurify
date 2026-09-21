import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const port = Number.parseInt(process.env.PORT ?? "4173", 10);
const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"]
]);

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new RangeError("PORT must be an integer from 1 through 65535.");
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", "http://localhost");
    const requestedPath = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
    const allowed =
      requestedPath === "/index.html" ||
      requestedPath === "/styles.css" ||
      (requestedPath.startsWith("/src/") && requestedPath.endsWith(".js"));
    if (!allowed) {
      respond(response, 404, "Not found");
      return;
    }
    const file = resolve(root, `.${requestedPath}`);
    const fromRoot = relative(root, file);
    if (isAbsolute(fromRoot) || fromRoot === ".." || fromRoot.startsWith(`..${sep}`)) {
      respond(response, 403, "Forbidden");
      return;
    }
    if ((await stat(file)).isDirectory()) {
      respond(response, 404, "Not found");
      return;
    }
    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Type": mimeTypes.get(extname(file)) ?? "application/octet-stream",
      "X-Content-Type-Options": "nosniff"
    });
    createReadStream(file).pipe(response);
  } catch {
    respond(response, 404, "Not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`StockPurify preview: http://127.0.0.1:${port}`);
});

function respond(response, status, body) {
  response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  response.end(body);
}
