import { run as createFolders } from "./create-folders.js";
import { run as createFiles } from "./create-files.js";
import { run as insertContent } from "./insert-content.js";
import { run as hookRoutes } from "./hook-routes.js";
import { run as createApp } from "./app/create-app.js";
import { run as createFileSyncEndpoint } from "./endpoints/file-sync.js";
import { run as hookAppStrategies } from "./app/hook-app-strategies.js";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const clientRoot = path.dirname(fileURLToPath(import.meta.url));
export function run() {
    const options = { clientRoot };
    createFolders();
    createFiles();
    insertContent();
    hookRoutes();
    createApp();
    createFileSyncEndpoint();
    hookAppStrategies();
    return { outputRoot: path.join(clientRoot, "output") };
}
const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) run();
