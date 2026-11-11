import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createFileSyncEndpoint } from "../../../src/v8/index.js";

const clientRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export function run() {
    const result = createFileSyncEndpoint({ clientRoot });
    console.log(`createFileSyncEndpoint completed: ${result.created}`);
    return result;
}
const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) run();
