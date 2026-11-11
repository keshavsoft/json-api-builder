import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "../../../src/v4/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(here, "..");

const result = build({ clientRoot });
console.log(`Client project generated at: ${result.outputRoot}`);
