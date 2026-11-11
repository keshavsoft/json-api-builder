import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

export function verifyGeneratedApp(options = {}) {
    const clientRoot = path.resolve(options.clientRoot ?? process.cwd());
    const outputRoot = path.resolve(options.outputRoot ?? path.join(clientRoot, "output"));
    const required = [
        "app.js",
        "api/routes.js",
        "api/v1/routes.js",
        "api/v1/clinics/routes.js",
        "endpoints/fs/routes.js",
        "data/players.json",
        "data/clinics.json"
    ];
    const missing = required.filter((relative) => !fs.existsSync(path.join(outputRoot, relative)));
    if (missing.length) {
        throw new Error(`Generated application is incomplete. Missing: ${missing.join(", ")}`);
    }

    const javascriptFiles = required.filter((file) => file.endsWith(".js"));
    for (const relative of javascriptFiles) {
        const filePath = path.join(outputRoot, relative);
        const source = fs.readFileSync(filePath, "utf8");
        if (!source.trim()) throw new Error(`Generated JavaScript file is empty: ${relative}`);

        const syntax = spawnSync(process.execPath, ["--check", filePath], { encoding: "utf8" });
        if (syntax.status !== 0) {
            throw new Error(`Generated JavaScript has a syntax error in ${relative}: ${syntax.stderr || syntax.stdout}`);
        }
    }

    for (const relative of required.filter((file) => file.endsWith(".json"))) {
        JSON.parse(fs.readFileSync(path.join(outputRoot, relative), "utf8"));
    }

    return {
        valid: true,
        checkedFiles: required.length,
        checkedJavaScript: javascriptFiles.length,
        checkedJson: required.length - javascriptFiles.length,
        outputRoot
    };
}
