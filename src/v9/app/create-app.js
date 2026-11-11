import fs from "node:fs";
import path from "node:path";

export function createApp(options = {}) {
    const clientRoot = path.resolve(options.clientRoot ?? process.cwd());
    const outputRoot = path.resolve(options.outputRoot ?? path.join(clientRoot, "output"));
    const appPath = path.join(outputRoot, "app.js");
    fs.mkdirSync(outputRoot, { recursive: true });
    fs.writeFileSync(appPath, [
        'import { Hono } from "hono";',
        "",
        "const app = new Hono();",
        "",
        "export default app;",
        ""
    ].join("\n"), "utf8");
    return { appPath, outputRoot };
}
