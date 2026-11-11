import path from "node:path";
import { fileURLToPath } from "node:url";
import { insertContent } from "../../src/v6/index.js";

const clientRoot = path.dirname(fileURLToPath(import.meta.url));
const result = insertContent({ clientRoot });

console.log("insertContent completed.");
console.log(`Output: ${result.outputRoot}`);
