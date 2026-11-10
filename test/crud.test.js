import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const dataFile = path.resolve("output/data/clinics.json");
const original = fs.readFileSync("input/data/clinics.json", "utf8");
let server;
const base = "http://127.0.0.1:3000/api/v1/clinics";

test("CRUD API persists data in the flat JSON file", async (t) => {
  if (!fs.existsSync("output/server.js")) {
    const build = spawn(process.execPath, ["src/index.js"], { stdio: "inherit" });
    await new Promise((resolve, reject) => {
      build.on("exit", (code) => code === 0 ? resolve() : reject(new Error("Build failed")));
    });
  }
  server = spawn(process.execPath, ["output/server.js"], { stdio: "ignore" });
  t.after(() => {
    server?.kill();
    fs.writeFileSync(dataFile, original);
  });
  await waitForServer();

  let response = await fetch(base);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).length, 2);

  response = await fetch(base, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Test Clinic", location: "Kakinada" })
  });
  assert.equal(response.status, 201);
  const created = await response.json();
  assert.ok(created.id);

  response = await fetch(`${base}/${created.id}`);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).name, "Test Clinic");

  response = await fetch(`${base}/${created.id}`, {
    method: "PUT", headers: { "content-type": "application/json" },
    body: JSON.stringify({ location: "Vizag" })
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).location, "Vizag");

  response = await fetch(`${base}/${created.id}`, { method: "DELETE" });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).deleted, true);

  response = await fetch(`${base}/${created.id}`);
  assert.equal(response.status, 404);

  response = await fetch(`${base}/999999`, { method: "DELETE" });
  assert.equal(response.status, 404);
});

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const response = await fetch(base);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Server did not start on port 3000");
}
