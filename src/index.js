import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const project = path.resolve(here, "..");
const config = JSON.parse(fs.readFileSync(path.join(project, "input/api.json"), "utf8"));
const output = path.join(project, "output");
const dataInput = path.join(project, "input/data");

const write = (file, content) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content.trimStart() + "\n");
};

const pascal = (value) => value.replace(/(^|[-_ ])(\w)/g, (_, p, c) => c.toUpperCase());
const collect = (node, segments = [], found = []) => {
  for (const [key, value] of Object.entries(node ?? {})) {
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    const next = [...segments, key];
    if (value.resource) {
      found.push({ segments: next, config: value });
      collect(value.children, next, found);
    } else {
      collect(value, next, found);
    }
  }
  return found;
};

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
console.log("01-traversal: reading API definition");

const resources = collect(config.routes);
const routeTree = (node, segments = []) => {
  const children = [];
  for (const [key, value] of Object.entries(node ?? {})) {
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    const next = [...segments, key];
    children.push({ key, segments: next, node: value });
  }
  return children;
};

console.log("02-create-folders: creating route folders");
const rootDir = path.join(output, config.root);
fs.mkdirSync(rootDir, { recursive: true });

const generateContainer = (node, dir, urlParts) => {
  const children = routeTree(node);
  const imports = [];
  const mounts = [];
  for (const child of children) {
    const varName = `${pascal(child.key)}Routes`;
    imports.push(`import ${varName} from "./${child.key}/routes.js";`);
    mounts.push(`routes.route("/${child.key}", ${varName});`);
    if (!child.node.resource) {
      generateContainer(child.node, path.join(dir, child.key), [...urlParts, child.key]);
    }
  }
  const source = `import { Hono } from "hono";
${imports.join("\n")}

const routes = new Hono();
${mounts.join("\n")}

export default routes;
export { routes };`;
  write(path.join(dir, "routes.js"), source);
};

console.log("03-create-files: creating route modules");
generateContainer(config.routes, rootDir, []);

for (const resource of resources) {
  const [version, ...resourcePath] = resource.segments;
  const dir = path.join(rootDir, ...resource.segments);
  fs.mkdirSync(dir, { recursive: true });
  const children = resource.config.children ?? {};
  const imports = [];
  const mounts = [];
  for (const childName of Object.keys(children)) {
    const varName = `${pascal(childName)}Routes`;
    imports.push(`import ${varName} from "./${childName}/routes.js";`);
    mounts.push(`routes.route("/${childName}", ${varName});`);
    const childDir = path.join(dir, childName);
    fs.mkdirSync(childDir, { recursive: true });
    write(path.join(childDir, "routes.js"), `import { Hono } from "hono";\n\nconst routes = new Hono();\n\nexport default routes;\nexport { routes };`);
  }

  const resourceName = resource.config.resource;
  const dataFile = path.relative(dir, path.join(output, "data", `${resourceName}.json`)).replaceAll(path.sep, "/");
  const idField = resource.config.idField ?? "id";
  const endpointCode = (resource.config.endpoints ?? []).map((ep) => {
    const method = ep.method.toUpperCase();
    switch (ep.operation) {
      case "list": return `routes.${method.toLowerCase()}("${ep.path}", async (c) => c.json(await readData()));`;
      case "create": return `routes.${method.toLowerCase()}("${ep.path}", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return c.json({ error: "Request body must be a JSON object" }, 400);
  const rows = await readData();
  const id = body[${JSON.stringify(idField)}] ?? (rows.reduce((max, row) => Math.max(max, Number(row[${JSON.stringify(idField)}]) || 0), 0) + 1);
  if (rows.some((row) => String(row[${JSON.stringify(idField)}]) === String(id))) return c.json({ error: "ID already exists" }, 409);
  const record = { ...body, [${JSON.stringify(idField)}]: id };
  rows.push(record);
  await writeData(rows);
  return c.json(record, 201);
});`;
      case "read": return `routes.${method.toLowerCase()}("${ep.path}", async (c) => {
  const row = (await readData()).find((item) => String(item[${JSON.stringify(idField)}]) === c.req.param("id"));
  return row ? c.json(row) : c.json({ error: "Record not found" }, 404);
});`;
      case "update": return `routes.${method.toLowerCase()}("${ep.path}", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return c.json({ error: "Request body must be a JSON object" }, 400);
  const rows = await readData();
  const index = rows.findIndex((item) => String(item[${JSON.stringify(idField)}]) === c.req.param("id"));
  if (index < 0) return c.json({ error: "Record not found" }, 404);
  rows[index] = { ...rows[index], ...body, [${JSON.stringify(idField)}]: rows[index][${JSON.stringify(idField)}] };
  await writeData(rows);
  return c.json(rows[index]);
});`;
      case "delete": return `routes.${method.toLowerCase()}("${ep.path}", async (c) => {
  const rows = await readData();
  const index = rows.findIndex((item) => String(item[${JSON.stringify(idField)}]) === c.req.param("id"));
  if (index < 0) return c.json({ error: "Record not found" }, 404);
  const [deleted] = rows.splice(index, 1);
  await writeData(rows);
  return c.json({ deleted: true, record: deleted });
});`;
      default: return `// Unsupported operation: ${ep.operation}`;
    }
  }).join("\n\n");

  const code = `import { Hono } from "hono";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
${imports.join("\n")}

const routes = new Hono();
const here = path.dirname(fileURLToPath(import.meta.url));
const dataFile = path.resolve(here, ${JSON.stringify(dataFile)});

async function readData() {
  try {
    const parsed = JSON.parse(await fs.readFile(dataFile, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function writeData(rows) {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  const temporary = dataFile + ".tmp";
  await fs.writeFile(temporary, JSON.stringify(rows, null, 2) + "\\n");
  await fs.rename(temporary, dataFile);
}

${mounts.join("\n")}

${endpointCode}

export default routes;
export { routes };`;
  write(path.join(dir, "routes.js"), code);
}

console.log("04-add-imports: child imports generated");
console.log("05-mount-routes: child routers mounted");
console.log("06-add-exports: default and named exports generated");

const rootRoutes = path.join(rootDir, "routes.js");
const server = `import { Hono } from "hono";
import { serve } from "@hono/node-server";
import routes from "./${config.root}/routes.js";

const app = new Hono();
app.route("/${config.root}", routes);

const port = Number(process.env.PORT ?? ${Number(config.port) || 3000});
serve({ fetch: app.fetch, port }, (info) => {
  console.log(\`Hono API running at http://localhost:\${info.port}/${config.root}\`);
});`;
write(path.join(output, "server.js"), server);

const dataOut = path.join(output, "data");
fs.mkdirSync(dataOut, { recursive: true });
for (const resource of resources) {
  const name = resource.config.resource;
  const source = path.join(dataInput, `${name}.json`);
  const destination = path.join(dataOut, `${name}.json`);
  if (fs.existsSync(source)) fs.copyFileSync(source, destination);
  else if (!fs.existsSync(destination)) fs.writeFileSync(destination, "[]\n");
}
console.log("07-add-endpoints: CRUD handlers generated");
console.log("Generated output/server.js");
