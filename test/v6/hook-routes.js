import path from "node:path";
import { fileURLToPath } from "node:url";
import { hookRoutes } from "../../src/v6/index.js";

const clientRoot = path.dirname(fileURLToPath(import.meta.url));
const result = hookRoutes({ clientRoot });

console.log("hookRoutes completed.");
console.log(`Output: ${result.outputRoot}`);
