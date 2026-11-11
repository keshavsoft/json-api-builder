import fs from "node:fs";
import path from "node:path";

function readJson(filePath) {
    if (!fs.existsSync(filePath)) throw new Error(`Required JSON file not found: ${filePath}`);
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function toPascalCase(value) {
    return value.replace(/(^|[-_\s])([a-z])/g, (_, __, letter) => letter.toUpperCase());
}

export function createEndpoints(options = {}) {
    const clientRoot = path.resolve(options.clientRoot ?? process.cwd());
    const inputRoot = path.resolve(options.inputRoot ?? path.join(clientRoot, "input"));
    const outputRoot = path.resolve(options.outputRoot ?? path.join(clientRoot, "output"));
    const api = readJson(path.resolve(clientRoot, options.apiPath ?? "input/api.json"));
    const generated = [];

    function visit(node, segments = []) {
        for (const [name, value] of Object.entries(node ?? {})) {
            if (!value || typeof value !== "object" || Array.isArray(value)) continue;
            if (Array.isArray(value.endpoints) && value.resource) {
                const resource = value.resource;
                const idField = value.idField ?? "id";
                const dataFile = value.dataFile ?? `data/${resource}.json`;
                const sourceData = path.resolve(inputRoot, dataFile.replace(/^data\//, "data/"));
                if (!fs.existsSync(sourceData)) throw new Error(`Data file for ${resource} not found: ${sourceData}`);
                const endpointDir = path.join(outputRoot, ...segments, name);
                fs.mkdirSync(endpointDir, { recursive: true });
                const relativeData = path.relative(endpointDir, path.resolve(outputRoot, dataFile)).split(path.sep).join("/");
                const dataImport = relativeData.startsWith(".") ? relativeData : `./${relativeData}`;
                const routeLines = [
                    'import { Hono } from "hono";',
                    'import { readFile, writeFile } from "node:fs/promises";',
                    'import { fileURLToPath } from "node:url";',
                    'import path from "node:path";',
                    "",
                    "const routes = new Hono();",
                    `const dataPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ${JSON.stringify(dataImport)});`,
                    "const readRows = async () => JSON.parse(await readFile(dataPath, \"utf8\"));",
                    "const writeRows = async (rows) => writeFile(dataPath, JSON.stringify(rows, null, 2) + \"\\n\");",
                    ""
                ];
                for (const endpoint of value.endpoints) {
                    const method = endpoint.method.toUpperCase();
                    const route = endpoint.path ?? "/";
                    if (method === "GET" && endpoint.operation === "list") {
                        routeLines.push(`routes.get(${JSON.stringify(route)}, async (c) => c.json(await readRows()));`);
                    } else if (method === "POST" && endpoint.operation === "create") {
                        routeLines.push(`routes.post(${JSON.stringify(route)}, async (c) => { const row = await c.req.json(); const rows = await readRows(); if (row[${JSON.stringify(idField)}] == null) row[${JSON.stringify(idField)}] = Date.now(); rows.push(row); await writeRows(rows); return c.json(row, 201); });`);
                    } else if (method === "GET" && endpoint.operation === "read") {
                        routeLines.push(`routes.get(${JSON.stringify(route)}, async (c) => { const row = (await readRows()).find((item) => String(item[${JSON.stringify(idField)}]) === c.req.param("id")); return row ? c.json(row) : c.json({ error: "Not found" }, 404); });`);
                    } else if (method === "PUT" && endpoint.operation === "update") {
                        routeLines.push(`routes.put(${JSON.stringify(route)}, async (c) => { const rows = await readRows(); const index = rows.findIndex((item) => String(item[${JSON.stringify(idField)}]) === c.req.param("id")); if (index < 0) return c.json({ error: "Not found" }, 404); rows[index] = { ...rows[index], ...await c.req.json(), [${JSON.stringify(idField)}]: rows[index][${JSON.stringify(idField)}] }; await writeRows(rows); return c.json(rows[index]); });`);
                    } else if (method === "DELETE" && endpoint.operation === "delete") {
                        routeLines.push(`routes.delete(${JSON.stringify(route)}, async (c) => { const rows = await readRows(); const next = rows.filter((item) => String(item[${JSON.stringify(idField)}]) !== c.req.param("id")); if (next.length === rows.length) return c.json({ error: "Not found" }, 404); await writeRows(next); return c.json({ deleted: true }); });`);
                    } else {
                        throw new Error(`Unsupported endpoint definition: ${method} ${route} (${endpoint.operation})`);
                    }
                }
                routeLines.push("", "export default routes;", "");
                const routeFile = path.join(endpointDir, "routes.js");
                fs.writeFileSync(routeFile, routeLines.join("\n"), "utf8");
                const targetData = path.resolve(outputRoot, dataFile);
                fs.mkdirSync(path.dirname(targetData), { recursive: true });
                fs.copyFileSync(sourceData, targetData);
                generated.push(routeFile);
                continue;
            }
            visit(value, [...segments, name]);
        }
    }

    visit(api.routes, [api.root ?? "api"]);
    return { generated, outputRoot };
}
