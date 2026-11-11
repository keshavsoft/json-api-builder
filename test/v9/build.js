import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build as buildV9 } from "../../src/v9/index.js";

const clientRoot = path.dirname(fileURLToPath(import.meta.url));

export function run() {
    const result = buildV9({ clientRoot });
    console.log("V9 generation and static validation completed.");
    return result;
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) run();
