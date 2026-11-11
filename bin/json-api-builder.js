#!/usr/bin/env node
import { build, createFiles, createFolders, insertContent } from "../src/v3/index.js";

const command = process.argv[2];
const commands = {
    folders: createFolders,
    files: createFiles,
    content: insertContent,
    build
};

if (!command || !commands[command]) {
    console.error("Usage: json-api-builder <folders|files|content|build>");
    process.exitCode = 1;
} else {
    try {
        await commands[command]();
        console.log(`json-api-builder: ${command} complete.`);
    } catch (error) {
        console.error(`json-api-builder: ${command} failed.`);
        console.error(error);
        process.exitCode = 1;
    }
}
