import path from "node:path";
import { fileURLToPath } from "node:url";
import { createFiles } from "../../src/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const result = createFiles({ clientRoot: here });

console.log("createFiles completed.");
console.log(`Output: ${result.outputRoot}`);
