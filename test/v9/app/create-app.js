import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createApp } from "../../../src/v9/index.js";

const clientRoot = path.dirname(fileURLToPath(import.meta.url));
export function run() {
    const result = createApp({ clientRoot: path.dirname(clientRoot) });
    console.log(`createApp completed: ${result.appPath}`);
    return result;
}
const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) run();
