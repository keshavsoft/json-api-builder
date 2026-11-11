import fs from "node:fs";
import path from "node:path";

export function verifyGeneratedApp(options = {}) {
    const outputRoot = path.resolve(options.outputRoot ?? path.join(options.clientRoot ?? process.cwd(), "output"));
    const required = ["app.js", "api/routes.js", "api/v1/routes.js", "api/v1/clinics/routes.js", "endpoints/fs/routes.js", "data/players.json", "data/clinics.json"];
    const missing = required.filter((relative) => !fs.existsSync(path.join(outputRoot, relative)));
    if (missing.length) throw new Error(`Generated application is incomplete. Missing: ${missing.join(", ")}`);
    for (const relative of required.filter((file) => file.endsWith(".js"))) {
        const source = fs.readFileSync(path.join(outputRoot, relative), "utf8");
        if (!source.trim()) throw new Error(`Generated JavaScript file is empty: ${relative}`);
    }
    return { valid: true, checkedFiles: required.length, outputRoot };
}
