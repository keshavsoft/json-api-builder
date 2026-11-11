import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createEndpoints } from "../../../src/v9/index.js";

const clientRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function run() {
    const result = createEndpoints({ clientRoot });
    console.log(`createEndpoints completed: ${result.generated.length} endpoint file(s).`);
    return result;
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) run();
