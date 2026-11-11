import path from "node:path";
import { fileURLToPath } from "node:url";
import { insertContent } from "../../src/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const result = insertContent({ clientRoot: here });

console.log("insertContent completed.");
console.log(`Output: ${result.outputRoot}`);
