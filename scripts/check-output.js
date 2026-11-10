import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve("output");
const files = [];
const walk = (dir) => {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) walk(full);
    else if (item.name.endsWith(".js")) files.push(full);
  }
};
if (!fs.existsSync(root)) {
  console.error("FAIL: output folder not found. Run npm run build first.");
  process.exit(1);
}
walk(root);
let failed = false;
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status === 0) console.log(`PASS: ${path.relative(process.cwd(), file)}`);
  else {
    failed = true;
    console.error(`FAIL: ${file}\n${result.stderr}`);
  }
}
console.log(`${files.length} JavaScript files checked; ${failed ? "errors found" : "0 syntax errors"}`);
process.exitCode = failed ? 1 : 0;
