import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { run as build } from "../build.js";

const testRoot = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(testRoot, "..");

test("generated API starts and serves clinics and runtime players.json", async (t) => {
    build();
    const appUrl = pathToFileURL(path.join(clientRoot, "output", "app.js")).href;
    const { default: app } = await import(`${appUrl}?runtime-test=${Date.now()}`);
    const server = serve({ fetch: app.fetch, port: 0, hostname: "127.0.0.1" });
    t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));

    await new Promise((resolve) => server.once("listening", resolve));
    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const clinicsResponse = await fetch(`${baseUrl}/api/v1/clinics`);
    assert.equal(clinicsResponse.status, 200);
    const clinics = await clinicsResponse.json();
    assert.ok(Array.isArray(clinics));
    assert.ok(clinics.length > 0);

    const playersResponse = await fetch(`${baseUrl}/fs/file-sync`);
    assert.equal(playersResponse.status, 200);
    const players = await playersResponse.json();
    assert.ok(Array.isArray(players));
    assert.equal(players[0].name, "Arjun");
});
