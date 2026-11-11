import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build, createFolders, createFiles, insertContent } from "../../src/v4/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = here;
const outputRoot = path.join(clientRoot, "output");

test("V4 exports all traversal stages", () => {
    assert.equal(typeof createFolders, "function");
    assert.equal(typeof createFiles, "function");
    assert.equal(typeof insertContent, "function");
    assert.equal(typeof build, "function");
});

test("V4 builds entirely inside the test client folder", () => {
    fs.rmSync(outputRoot, { recursive: true, force: true });

    const result = build({ clientRoot });

    assert.equal(result.outputRoot, outputRoot);
    assert.ok(fs.existsSync(path.join(outputRoot, "API", "routes.js")));
    assert.ok(fs.existsSync(path.join(outputRoot, "API", "V1", "routes.js")));
    assert.ok(fs.existsSync(path.join(outputRoot, "API", "V1", "Clinics", "routes.js")));

    const generated = fs.readFileSync(path.join(outputRoot, "API", "routes.js"), "utf8");
    assert.match(generated, /Hono/);

    // The package implementation directory is not used as a generation target.
    assert.equal(fs.existsSync(path.join(here, "..", "src", "generated-project")), false);
});
