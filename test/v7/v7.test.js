import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { run as createFolders } from "./create-folders.js";
import { run as createFiles } from "./create-files.js";
import { run as insertContent } from "./insert-content.js";
import { run as hookRoutes } from "./hook-routes.js";
import { run as build } from "./build.js";

const clientRoot = path.dirname(fileURLToPath(import.meta.url));
const outputRoot = path.join(clientRoot, "output");

test("V7 individual task runners execute the reusable package functions", () => {
    fs.rmSync(outputRoot, { recursive: true, force: true });
    createFolders();
    assert.ok(fs.existsSync(path.join(outputRoot, "api", "v1", "clinics")));
    createFiles();
    insertContent();
    hookRoutes();

    const rootRoutes = fs.readFileSync(path.join(outputRoot, "api", "routes.js"), "utf8");
    const v1Routes = fs.readFileSync(path.join(outputRoot, "api", "v1", "routes.js"), "utf8");
    assert.match(rootRoutes, /import v1Routes from "\.\/v1\/routes\.js";/);
    assert.match(rootRoutes, /app\.route\("\/v1", v1Routes\);/);
    assert.match(v1Routes, /import clinicsRoutes from "\.\/clinics\/routes\.js";/);
    assert.match(v1Routes, /app\.route\("\/clinics", clinicsRoutes\);/);
});

test("V7 combined test runner composes the individual test runners", () => {
    fs.rmSync(outputRoot, { recursive: true, force: true });
    const result = build();
    assert.equal(result.outputRoot, outputRoot);
    const rootRoutes = fs.readFileSync(path.join(outputRoot, "api", "routes.js"), "utf8");
    assert.match(rootRoutes, /app\.route\("\/v1", v1Routes\);/);
});

test("V7 route hooking is idempotent", () => {
    hookRoutes();
    const rootRoutes = fs.readFileSync(path.join(outputRoot, "api", "routes.js"), "utf8");
    assert.equal((rootRoutes.match(/app\.route\("\/v1"/g) ?? []).length, 1);
    assert.equal((rootRoutes.match(/import v1Routes/g) ?? []).length, 1);
});
