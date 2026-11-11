import fs from "node:fs";
import path from "node:path";

export function validateConfiguration(options = {}) {
    const clientRoot = path.resolve(options.clientRoot ?? process.cwd());
    const apiPath = path.resolve(clientRoot, options.apiPath ?? "input/api.json");
    const treePath = path.resolve(clientRoot, options.treePath ?? "input/source-of-truth/tree.json");
    const api = JSON.parse(fs.readFileSync(apiPath, "utf8"));
    JSON.parse(fs.readFileSync(treePath, "utf8"));
    if (!Number.isInteger(Number(api.port)) || Number(api.port) < 1 || Number(api.port) > 65535) {
        throw new Error(`Invalid or missing API port in ${apiPath}`);
    }
    if (!api.root || !api.routes || typeof api.routes !== "object") {
        throw new Error(`API configuration must define root and routes: ${apiPath}`);
    }
    const checkedData = [];
    const visit = (node) => {
        for (const value of Object.values(node ?? {})) {
            if (!value || typeof value !== "object" || Array.isArray(value)) continue;
            if (value.resource && Array.isArray(value.endpoints)) {
                const dataFile = value.dataFile ?? `data/${value.resource}.json`;
                const filePath = path.resolve(clientRoot, "input", dataFile);
                const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
                if (!Array.isArray(parsed)) throw new Error(`Expected an array in ${filePath}`);
                checkedData.push(filePath);
            } else visit(value);
        }
    };
    visit(api.routes);
    for (const strategy of Object.values(api.strategies ?? {})) {
        for (const config of Object.values(strategy ?? {})) {
            if (!config?.dataFile) continue;
            const filePath = path.resolve(clientRoot, "input", config.dataFile);
            JSON.parse(fs.readFileSync(filePath, "utf8"));
            checkedData.push(filePath);
        }
    }
    return { valid: true, port: Number(api.port), checkedData };
}
