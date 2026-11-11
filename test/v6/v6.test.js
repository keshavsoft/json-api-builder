import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createFolders, createFiles, insertContent, hookRoutes, build } from "../../src/v6/index.js";

const clientRoot = path.dirname(fileURLToPath(import.meta.url));
const outputRoot = path.join(clientRoot, "output");

test("V6 individual stages create, populate, and hook route files", () => {
    fs.rmSync(outputRoot, { recursive: true, force: true });

    createFolders({ clientRoot });
    assert.ok(fs.existsSync(path.join(outputRoot, "API", "V1", "Clinics")));

    createFiles({ clientRoot });
    insertContent({ clientRoot });

    const rootRoutes = path.join(outputRoot, "API", "routes.js");
    const v1Routes = path.join(outputRoot, "API", "V1", "routes.js");

    assert.match(fs.readFileSync(rootRoutes, "utf8"), /import \{ Hono \} from "hono";/);
    assert.match(fs.readFileSync(rootRoutes, "utf8"), /export default app;/);

    const result = hookRoutes({ clientRoot });
    assert.equal(result.hookedFiles, 2);

    const rootSource = fs.readFileSync(rootRoutes, "utf8");
    const v1Source = fs.readFileSync(v1Routes, "utf8");

    assert.match(rootSource, /import v1Routes from "\.\/V1\/routes\.js";/);
    assert.match(rootSource, /app\.route\("\/v1", v1Routes\);/);
    assert.match(v1Source, /import clinicsRoutes from "\.\/Clinics\/routes\.js";/);
    assert.match(v1Source, /app\.route\("\/clinics", clinicsRoutes\);/);
});

test("V6 hook stage is idempotent", () => {
    hookRoutes({ clientRoot });
    const source = fs.readFileSync(path.join(outputRoot, "API", "routes.js"), "utf8");
    assert.equal((source.match(/app\.route\("\/v1"/g) ?? []).length, 1);
    assert.equal((source.match(/import v1Routes/g) ?? []).length, 1);
});

test("V6 combined build runs all stages in order", () => {
    fs.rmSync(outputRoot, { recursive: true, force: true });
    const result = build({ clientRoot });
    assert.equal(result.outputRoot, outputRoot);
    const source = fs.readFileSync(path.join(outputRoot, "API", "routes.js"), "utf8");
    assert.match(source, /app\.route\("\/v1", v1Routes\);/);
});
