import fs from "node:fs";
import path from "node:path";

function readApiConfig(clientRoot, apiPath) {
    const filePath = path.resolve(clientRoot, apiPath ?? "input/api.json");
    if (!fs.existsSync(filePath)) {
        throw new Error(`API configuration not found: ${filePath}`);
    }
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function createFileSyncEndpoint(options = {}) {
    const clientRoot = path.resolve(options.clientRoot ?? process.cwd());
    const outputRoot = path.resolve(options.outputRoot ?? path.join(clientRoot, "output"));
    const api = readApiConfig(clientRoot, options.apiPath);
    const strategy = api.strategies?.fs?.["file-sync"];

    if (!strategy) {
        return { created: false, outputRoot };
    }
    if (strategy.method !== "GET") {
        throw new Error(`Unsupported file-sync method: ${strategy.method}`);
    }

    const endpointDir = path.join(outputRoot, "endpoints", "fs");
    const endpointPath = path.join(endpointDir, "routes.js");
    const dataSource = path.resolve(clientRoot, "input", strategy.dataFile);
    const dataTarget = path.resolve(outputRoot, strategy.dataFile);
    const relativeDataPath = path.relative(endpointDir, dataTarget).split(path.sep).join("/");
    const importPath = relativeDataPath.startsWith(".") ? relativeDataPath : `./${relativeDataPath}`;

    if (!fs.existsSync(dataSource)) {
        throw new Error(`File-sync data JSON not found: ${dataSource}`);
    }

    fs.mkdirSync(path.dirname(dataTarget), { recursive: true });
    fs.copyFileSync(dataSource, dataTarget);
    fs.mkdirSync(endpointDir, { recursive: true });

    const routePath = strategy.path ?? "/file-sync";
    fs.writeFileSync(endpointPath, [
        'import { Hono } from "hono";',
        'import { readFile } from "node:fs/promises";',
        'import { fileURLToPath } from "node:url";',
        'import path from "node:path";',
        "",
        "const routes = new Hono();",
        `const dataPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ${JSON.stringify(importPath)});`,
        `routes.get(${JSON.stringify(routePath)}, async (c) => {`,
        '    const data = JSON.parse(await readFile(dataPath, "utf8"));',
        '    return c.json(data);',
        "});",
        "",
        "export default routes;",
        ""
    ].join("\n"), "utf8");

    return { created: true, endpointPath, dataTarget, outputRoot };
}
