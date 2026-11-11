import fs from "node:fs";
import path from "node:path";
import startFunc from "json-traversal-core";
import { fileURLToPath } from "node:url";

function resolveOptions(options = {}) {
    const sourceRoot = path.resolve(options.sourceRoot ?? path.join(path.dirname(fileURLToPath(import.meta.url)), "../v2/source-of-truth"));
    const outputRoot = path.resolve(options.outputRoot ?? path.join(sourceRoot, "../generated-project"));
    const treePath = path.resolve(options.treePath ?? path.join(sourceRoot, "tree.json"));
    const tree = JSON.parse(fs.readFileSync(treePath, "utf8"));

    return { sourceRoot, outputRoot, tree };
}

function targetPath(outputRoot, key, parentPath) {
    const parentParts = parentPath === "" ? [] : parentPath.split(".");
    return path.join(outputRoot, ...parentParts, key);
}

export function createFolders(options = {}) {
    const { outputRoot, tree } = resolveOptions(options);

    startFunc(tree, (key, value, parentPath) => {
        if (value !== null && typeof value === "object" && !Array.isArray(value)) {
            const folderPath = targetPath(outputRoot, key, parentPath);
            fs.mkdirSync(folderPath, { recursive: true });
        }
    });

    return { outputRoot };
}

export function createFiles(options = {}) {
    const { outputRoot, tree } = resolveOptions(options);

    startFunc(tree, (key, value, parentPath) => {
        if (typeof value === "string") {
            const filePath = targetPath(outputRoot, key, parentPath);
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
            if (!fs.existsSync(filePath)) {
                fs.writeFileSync(filePath, "", "utf8");
            }
        }
    });

    return { outputRoot };
}

export function insertContent(options = {}) {
    const { sourceRoot, outputRoot, tree } = resolveOptions(options);
    // Lazy import keeps the renderer isolated to the content-generation stage.
    return import("astring").then(({ generate }) => {
        startFunc(tree, (key, value, parentPath) => {
            if (typeof value === "string") {
                const definitionPath = path.resolve(sourceRoot, value);
                const ast = JSON.parse(fs.readFileSync(definitionPath, "utf8"));
                const javascript = generate(ast);
                const filePath = targetPath(outputRoot, key, parentPath);

                fs.mkdirSync(path.dirname(filePath), { recursive: true });
                fs.writeFileSync(filePath, javascript + "\\n", "utf8");
            }
        });

        return { outputRoot };
    });
}

export async function build(options = {}) {
    createFolders(options);
    createFiles(options);
    await insertContent(options);
    return { outputRoot: resolveOptions(options).outputRoot };
}

export default { createFolders, createFiles, insertContent, build };
