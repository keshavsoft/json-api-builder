import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { run as build } from "./build.js";
import { createApp, createFileSyncEndpoint, hookAppStrategies } from "../../src/v9/index.js";

const clientRoot = path.dirname(fileURLToPath(import.meta.url));
const outputRoot = path.join(clientRoot, "output");

test("V9 build generates complete application and endpoint source", () => {
    fs.rmSync(outputRoot, { recursive: true, force: true });
    const result = build();
    assert.equal(result.outputRoot, outputRoot);

    const expectedFiles = [
        "app.js",
        "api/routes.js",
        "api/v1/routes.js",
        "api/v1/clinics/routes.js",
        "endpoints/fs/routes.js",
        "data/clinics.json",
        "data/players.json"
    ];
    for (const relative of expectedFiles) {
        assert.ok(fs.existsSync(path.join(outputRoot, relative)), `Missing generated file: ${relative}`);
    }

    const appSource = fs.readFileSync(path.join(outputRoot, "app.js"), "utf8");
    assert.match(appSource, /import apiRoutes from "\.\/api\/routes\.js"/);
    assert.match(appSource, /import fsRoutes from "\.\/endpoints\/fs\/routes\.js"/);
    assert.match(appSource, /app\.route\("\/api", apiRoutes\)/);
    assert.match(appSource, /app\.route\("\/fs", fsRoutes\)/);
    assert.match(appSource, /startServer/);

    const clinicSource = fs.readFileSync(path.join(outputRoot, "api/v1/clinics/routes.js"), "utf8");
    for (const pattern of [/routes\.get\("\/"/, /routes\.post\("\/"/, /routes\.get\("\/:id"/, /routes\.put\("\/:id"/, /routes\.delete\("\/:id"/]) {
        assert.match(clinicSource, pattern);
    }

    const fileSyncSource = fs.readFileSync(path.join(outputRoot, "endpoints/fs/routes.js"), "utf8");
    assert.match(fileSyncSource, /routes\.get\("\/file-sync"/);
    assert.match(fileSyncSource, /readFile\(dataPath/);
    assert.equal(result.validation.valid, true);
});

test("V9 app and strategy hooks are repeatable without duplicate mounts", () => {
    createApp({ clientRoot });
    createFileSyncEndpoint({ clientRoot });
    hookAppStrategies({ clientRoot });
    hookAppStrategies({ clientRoot });
    const appSource = fs.readFileSync(path.join(outputRoot, "app.js"), "utf8");
    assert.equal((appSource.match(/app\.route\("\/fs"/g) ?? []).length, 1);
    assert.equal((appSource.match(/import fsRoutes/g) ?? []).length, 1);
});
