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

    if (api.root) {
        imports.push(`import apiRoutes from "./${api.root}/routes.js";`);
        mounts.push(`app.route("/${api.root}", apiRoutes);`);
    }

    for (const [strategyName, strategyConfig] of Object.entries(api.strategies ?? {})) {
        if (strategyName === "fs" && strategyConfig?.["file-sync"]) {
            imports.push('import fsRoutes from "./endpoints/fs/routes.js";');
            mounts.push('app.route("/fs", fsRoutes);');
        }
    }

    const lines = source.split("\n").filter(line =>
        !/^import apiRoutes from /.test(line) &&
        !/^import fsRoutes from /.test(line) &&
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
        ""
    ].join("\n");
    fs.writeFileSync(appPath, finalSource, "utf8");
    return { appPath, hookedStrategies: Object.keys(api.strategies ?? {}) };
}
