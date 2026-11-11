import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { run as createFolders } from "./create-folders.js";
import { run as createFiles } from "./create-files.js";
import { run as insertContent } from "./insert-content.js";
import { run as hookRoutes } from "./hook-routes.js";

export function run() {
    const foldersResult = createFolders();
    createFiles();
    insertContent();
    hookRoutes();
    console.log("V7 combined build completed.");
    return foldersResult;
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) {
    run();
}
