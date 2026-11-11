import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { hookAppStrategies } from "../../../src/v8/index.js";

const clientRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export function run() {
    const result = hookAppStrategies({ clientRoot });
    console.log(`hookAppStrategies completed: ${result.appPath}`);
    return result;
}
const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) run();
