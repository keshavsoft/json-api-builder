import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "../../src/v6/index.js";

const clientRoot = path.dirname(fileURLToPath(import.meta.url));
const result = build({ clientRoot });

console.log("build completed.");
console.log(`Output: ${result.outputRoot}`);
