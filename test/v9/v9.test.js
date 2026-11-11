import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { run as build } from "./build.js";
import { createApp } from "../../src/index.js";
import { createFileSyncEndpoint } from "../../src/index.js";
import { hookAppStrategies } from "../../src/index.js";

const clientRoot = path.dirname(fileURLToPath(import.meta.url));
const outputRoot = path.join(clientRoot, "output");

test("V8 build creates app skeleton, file-sync endpoint, and hooks strategies", () => {
    fs.rmSync(outputRoot, { recursive: true, force: true });
    const result = build();
    assert.equal(result.outputRoot, outputRoot);
    const appSource = fs.readFileSync(path.join(outputRoot, "app.js"), "utf8");
    const endpointSource = fs.readFileSync(path.join(outputRoot, "endpoints", "fs", "routes.js"), "utf8");
    assert.match(appSource, /import apiRoutes from "\.\/api\/routes\.js"/);
    assert.match(appSource, /import fsRoutes from "\.\/endpoints\/fs\/routes\.js"/);
    assert.match(appSource, /app\.route\("\/fs", fsRoutes\)/);
    assert.match(endpointSource, /routes\.get\("\/file-sync"/);
    assert.ok(fs.existsSync(path.join(outputRoot, "data", "clinics.json")));
    assert.ok(fs.existsSync(path.join(outputRoot, "data", "players.json")));
    assert.match(endpointSource, /readFile\(dataPath/);
    const clinicsSource = fs.readFileSync(path.join(outputRoot, "api", "v1", "clinics", "routes.js"), "utf8");
    assert.match(clinicsSource, /routes\.get\("\/"/);
    assert.match(clinicsSource, /routes\.post\("\/"/);
    assert.match(clinicsSource, /routes\.put\("\/:id"/);
    assert.match(clinicsSource, /routes\.delete\("\/:id"/);
    assert.match(appSource, /startServer/);
});

test("V8 app creation and strategy hooking are independently repeatable", () => {
    createApp({ clientRoot });
    createFileSyncEndpoint({ clientRoot });
    hookAppStrategies({ clientRoot });
    hookAppStrategies({ clientRoot });
    const appSource = fs.readFileSync(path.join(outputRoot, "app.js"), "utf8");
    assert.equal((appSource.match(/app\.route\("\/fs"/g) ?? []).length, 1);
    assert.equal((appSource.match(/import fsRoutes/g) ?? []).length, 1);
});
