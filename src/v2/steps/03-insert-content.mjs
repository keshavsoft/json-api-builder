import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import startFunc from "json-traversal-core";

const here = path.dirname(fileURLToPath(import.meta.url));
const sourceRoot = path.resolve(here, "../source-of-truth");
const outputRoot = path.resolve(here, "../generated-project");
const tree = JSON.parse(fs.readFileSync(path.join(sourceRoot, "tree.json"), "utf8"));

function targetPath(key, parentPath) {
    const parentParts = parentPath === "" ? [] : parentPath.split(".");
    return path.join(outputRoot, ...parentParts, key);
}

import { generate } from "astring";

startFunc(tree, (key, value, parentPath) => {
    if (typeof value === "string") {
        const definitionPath = path.resolve(sourceRoot, value);
        const ast = JSON.parse(fs.readFileSync(definitionPath, "utf8"));
        const javascript = generate(ast);
        const filePath = targetPath(key, parentPath);

        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, javascript + "\n", "utf8");
        console.log(`Content inserted: ${filePath}`);
    }
});

console.log("Step 3 complete: content insertion.");
