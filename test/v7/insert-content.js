import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {insertContent} from "../../src/v7/index.js";

const clientRoot = path.dirname(fileURLToPath(import.meta.url));

export function run() {
    const result = insertContent({ clientRoot });
    console.log("insertContent completed.");
    console.log(`Output: ${result.outputRoot}`);
    return result;
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) {
    run();
}
