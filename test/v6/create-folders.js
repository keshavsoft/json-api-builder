import path from "node:path";
import { fileURLToPath } from "node:url";
import { createFolders } from "../../src/v6/index.js";

const clientRoot = path.dirname(fileURLToPath(import.meta.url));
const result = createFolders({ clientRoot });

console.log("createFolders completed.");
console.log(`Output: ${result.outputRoot}`);
