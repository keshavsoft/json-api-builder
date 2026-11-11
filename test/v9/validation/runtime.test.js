import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { run as build } from "../build.js";

const testRoot = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(testRoot, "..");

test("generated V9 server responds to file-sync and clinic CRUD HTTP requests", async (t) => {
    build();

    let serve;
    try {
        ({ serve } = await import("@hono/node-server"));
    } catch (error) {
        if (error.code === "ERR_MODULE_NOT_FOUND") {
            t.skip("Runtime dependencies are not installed. Run npm install, then npm run v9:runtime-test.");
            return;
        }
        throw error;
    }

    const appUrl = pathToFileURL(path.join(clientRoot, "output", "app.js")).href;
    let appModule;
    try {
        appModule = await import(`${appUrl}?runtime-test=${Date.now()}`);
    } catch (error) {
        if (error.code === "ERR_MODULE_NOT_FOUND") {
            t.skip("Hono runtime dependency is not installed. Run npm install, then npm run v9:runtime-test.");
            return;
        }
        throw error;
    }

    const server = serve({ fetch: appModule.default.fetch, port: 0, hostname: "127.0.0.1" });
    t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));

    await new Promise((resolve, reject) => {
        server.once("listening", resolve);
        server.once("error", reject);
    });

    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const playersResponse = await fetch(`${baseUrl}/fs/file-sync`);
    assert.equal(playersResponse.status, 200);
    const players = await playersResponse.json();
    assert.ok(Array.isArray(players));
    assert.equal(players[0].name, "Arjun");

    const listResponse = await fetch(`${baseUrl}/api/v1/clinics`);
    assert.equal(listResponse.status, 200);
    const clinics = await listResponse.json();
    assert.ok(Array.isArray(clinics));
    assert.ok(clinics.length > 0);

    const testId = 987654321;
    const createdResponse = await fetch(`${baseUrl}/api/v1/clinics`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: testId, name: "V9 Runtime Test Clinic", location: "Test" })
    });
    assert.equal(createdResponse.status, 201);
    assert.equal((await createdResponse.json()).id, testId);

    const readResponse = await fetch(`${baseUrl}/api/v1/clinics/${testId}`);
    assert.equal(readResponse.status, 200);
    assert.equal((await readResponse.json()).name, "V9 Runtime Test Clinic");

    const updateResponse = await fetch(`${baseUrl}/api/v1/clinics/${testId}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "V9 Updated Clinic" })
    });
    assert.equal(updateResponse.status, 200);
    assert.equal((await updateResponse.json()).name, "V9 Updated Clinic");

    const deleteResponse = await fetch(`${baseUrl}/api/v1/clinics/${testId}`, { method: "DELETE" });
    assert.equal(deleteResponse.status, 200);
    assert.deepEqual(await deleteResponse.json(), { deleted: true });

    const missingResponse = await fetch(`${baseUrl}/api/v1/clinics/${testId}`);
    assert.equal(missingResponse.status, 404);

    const outputData = JSON.parse(fs.readFileSync(path.join(clientRoot, "output/data/clinics.json"), "utf8"));
    assert.ok(!outputData.some((clinic) => clinic.id === testId), "CRUD test record should be removed");
});
