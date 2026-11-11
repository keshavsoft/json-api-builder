import fs from "node:fs";
import path from "node:path";
import v7 from "../v7/index.js";
import { createApp } from "./app/create-app.js";
import { hookAppStrategies } from "./app/hook-app-strategies.js";
import { createFileSyncEndpoint } from "./endpoints/file-sync/index.js";
import { createEndpoints } from "./endpoints/create-endpoints.js";
import { validateConfiguration } from "./validation/validate-configuration.js";
import { verifyGeneratedApp } from "./validation/verify-generated-app.js";

export const createFolders = v7.createFolders;
export const createFiles = v7.createFiles;
export const insertContent = v7.insertContent;
export const hookRoutes = v7.hookRoutes;
export { createApp, hookAppStrategies, createFileSyncEndpoint, createEndpoints, validateConfiguration, verifyGeneratedApp };

export function build(options = {}) {
    const clientRoot = path.resolve(options.clientRoot ?? process.cwd());
    const outputRoot = path.resolve(options.outputRoot ?? path.join(clientRoot, "output"));

    validateConfiguration({ ...options, clientRoot });
    createFolders({ ...options, clientRoot, outputRoot });
    createFiles({ ...options, clientRoot, outputRoot });
    insertContent({ ...options, clientRoot, outputRoot });
    hookRoutes({ ...options, clientRoot, outputRoot });
    createApp({ ...options, clientRoot, outputRoot });
    createFileSyncEndpoint({ ...options, clientRoot, outputRoot });
    createEndpoints({ ...options, clientRoot, outputRoot });
    hookAppStrategies({ ...options, clientRoot, outputRoot });
    const validation = verifyGeneratedApp({ ...options, clientRoot, outputRoot });

    return { outputRoot, appPath: path.join(outputRoot, "app.js"), validation };
}

export default {
    createFolders,
    createFiles,
    insertContent,
    hookRoutes,
    createApp,
    createFileSyncEndpoint,
    hookAppStrategies,
    build
};
