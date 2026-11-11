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

startFunc(tree, (key, value, parentPath) => {
    if (typeof value === "string") {
        const filePath = targetPath(key, parentPath);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, "", "utf8");
        console.log(`Empty file created: ${filePath}`);
    }
});

console.log("Step 2 complete: empty file creation.");
