import fs from "node:fs";
import path from "node:path";
import startFunc from "json-traversal-core";
import { generate } from "astring";

function resolvePaths(options = {}) {
    const clientRoot = path.resolve(options.clientRoot ?? process.cwd());
    const inputRoot = path.resolve(options.inputRoot ?? path.join(clientRoot, "input"));
    const sourceRoot = path.resolve(options.sourceRoot ?? path.join(inputRoot, "source-of-truth"));
    const outputRoot = path.resolve(options.outputRoot ?? path.join(clientRoot, "output"));
    const treePath = path.resolve(options.treePath ?? path.join(sourceRoot, "tree.json"));

    if (!fs.existsSync(treePath)) {
        throw new Error(`Tree definition not found: ${treePath}`);
    }

    const tree = JSON.parse(fs.readFileSync(treePath, "utf8"));
    return { clientRoot, inputRoot, sourceRoot, outputRoot, tree, treePath };
}

function targetPath(outputRoot, key, parentPath) {
    const parentParts = parentPath === "" ? [] : parentPath.split(".");
    return path.join(outputRoot, ...parentParts, key);
}

export function createFolders(options = {}) {
    const { outputRoot, tree } = resolvePaths(options);

    startFunc(tree, (key, value, parentPath) => {
        if (value !== null && typeof value === "object" && !Array.isArray(value)) {
            fs.mkdirSync(targetPath(outputRoot, key, parentPath), { recursive: true });
        }
    });

    return { outputRoot };
}

export function createFiles(options = {}) {
    const { outputRoot, tree } = resolvePaths(options);

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
    const { sourceRoot, outputRoot, tree } = resolvePaths(options);

    startFunc(tree, (key, value, parentPath) => {
        if (typeof value === "string") {
            const definitionPath = path.resolve(sourceRoot, value);
            if (!fs.existsSync(definitionPath)) {
                throw new Error(`AST definition not found: ${definitionPath}`);
            }

            const ast = JSON.parse(fs.readFileSync(definitionPath, "utf8"));
            const javascript = generate(ast);
            const filePath = targetPath(outputRoot, key, parentPath);

            fs.mkdirSync(path.dirname(filePath), { recursive: true });
            fs.writeFileSync(filePath, `${javascript}\n`, "utf8");
        }
    });

    return { outputRoot };
}

export default { createFolders, createFiles, insertContent };
