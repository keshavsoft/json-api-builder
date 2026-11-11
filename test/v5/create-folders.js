import path from "node:path";
import { fileURLToPath } from "node:url";
import { createFolders } from "../../src/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const result = createFolders({ clientRoot: here });

console.log("createFolders completed.");
console.log(`Output: ${result.outputRoot}`);
