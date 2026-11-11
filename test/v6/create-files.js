import path from "node:path";
import { fileURLToPath } from "node:url";
import { createFiles } from "../../src/v6/index.js";

const clientRoot = path.dirname(fileURLToPath(import.meta.url));
const result = createFiles({ clientRoot });

console.log("createFiles completed.");
console.log(`Output: ${result.outputRoot}`);
