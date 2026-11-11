import fs from "node:fs";
import path from "node:path";

export function hookAppStrategies(options = {}) {
    const clientRoot = path.resolve(options.clientRoot ?? process.cwd());
    const outputRoot = path.resolve(options.outputRoot ?? path.join(clientRoot, "output"));
    const apiPath = path.resolve(clientRoot, options.apiPath ?? "input/api.json");
    const appPath = path.join(outputRoot, "app.js");

    if (!fs.existsSync(apiPath)) throw new Error(`API configuration not found: ${apiPath}`);
    if (!fs.existsSync(appPath)) throw new Error(`app.js not found. Run createApp first: ${appPath}`);

    const api = JSON.parse(fs.readFileSync(apiPath, "utf8"));
    let source = fs.readFileSync(appPath, "utf8");
    const imports = [];
    const mounts = [];
    const startup = [];

    if (api.root) {
        imports.push(`import apiRoutes from "./${api.root}/routes.js";`);
        mounts.push(`app.route("/${api.root}", apiRoutes);`);
    }

    for (const [strategyName, strategyConfig] of Object.entries(api.strategies ?? {})) {
        if (strategyName === "fs" && strategyConfig?.["file-sync"]) {
            imports.push('import fsRoutes from "./endpoints/fs/routes.js";');
            imports.push('import { serve } from "@hono/node-server";');
            imports.push('import { pathToFileURL } from "node:url";');
            imports.push('import path from "node:path";');
            mounts.push('app.route("/fs", fsRoutes);');
        }
    }

    const lines = source.split("\n").filter(line =>
        !/^import apiRoutes from /.test(line) &&
        !/^import fsRoutes from /.test(line) &&
        !/^import \{ serve \} from /.test(line) &&
        !/^import \{ pathToFileURL \} from /.test(line) &&
        !/^import path from /.test(line) &&
        !/^app\.route\("\/(?:api|fs)",/.test(line)
    );
    const exportIndex = lines.findIndex(line => line.trim() === "export default app;");
    if (exportIndex < 0) throw new Error(`Default app export not found: ${appPath}`);

    const skeleton = lines.slice(0, exportIndex).filter(line => line.trim() !== "");
    const finalSource = [
        ...new Set([...lines.filter(line => line.startsWith("import ")), ...imports]),
        "",
        ...skeleton.filter(line => !line.startsWith("import ")),
        "",
        ...mounts,
        "",
        "export default app;",
        "",
        "export function startServer(port = Number(process.env.PORT ?? " + Number(api.port ?? 3000) + ")) {",
        '    return serve({ fetch: app.fetch, port, hostname: "0.0.0.0" });',
        "}",
        "",
        'if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {',
        `    startServer(Number(process.env.PORT ?? ${Number(api.port ?? 3000)}));`,
        `    console.log("API server listening on port ${Number(api.port ?? 3000)}");`,
        "}",
        ""
    ].join("\n");
    fs.writeFileSync(appPath, finalSource, "utf8");
    return { appPath, hookedStrategies: Object.keys(api.strategies ?? {}) };
}
