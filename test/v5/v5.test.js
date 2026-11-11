import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createFolders, createFiles, insertContent } from "../../src/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const outputRoot = path.join(here, "output");

test("createFolders creates the client folder structure", () => {
    fs.rmSync(outputRoot, { recursive: true, force: true });
    const result = createFolders({ clientRoot: here });

    assert.equal(result.outputRoot, outputRoot);
    assert.ok(fs.existsSync(path.join(outputRoot, "API", "V1", "Clinics")));
});

test("createFiles creates route files without overwriting existing files", () => {
    const result = createFiles({ clientRoot: here });
    const routeFile = path.join(outputRoot, "API", "routes.js");

    assert.equal(result.outputRoot, outputRoot);
    assert.ok(fs.existsSync(routeFile));
    fs.writeFileSync(routeFile, "// preserve me", "utf8");
    createFiles({ clientRoot: here });
    assert.equal(fs.readFileSync(routeFile, "utf8"), "// preserve me");
});

test("insertContent writes ESTree-generated JavaScript into client files", () => {
    const result = insertContent({ clientRoot: here });
    const routeFile = path.join(outputRoot, "API", "routes.js");

    assert.equal(result.outputRoot, outputRoot);
    const content = fs.readFileSync(routeFile, "utf8");
    assert.match(content, /Hono/);
    assert.match(content, /export default app/);
});
