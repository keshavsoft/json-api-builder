# JSON API Builder

**Current documented version: V7 (1.7.0)**

JSON API Builder is an experimental Node.js package for generating a backend project from JSON-based definitions. The current implementation focuses on building a folder/file structure, inserting a default Hono JavaScript template from an ESTree JSON file, and connecting nested route modules.

The project is being developed incrementally. V1–V6 are retained as earlier iterations; V7 is the current development version.

## V7 design

V7 separates two responsibilities:

- `src/v7/` contains reusable package functionality.
- `test/v7/` acts as a client project, with its own input, individual task runners, combined runner, tests, and generated output.

The test runners import and reuse the package functions. The combined test runner imports the individual test runners instead of duplicating their implementation.

## Project layout

```text
json-api-builder/
├── src/
│   ├── index.js                 # Package entry point (V7)
│   ├── v1/ ... v6/              # Earlier iterations
│   └── v7/
│       ├── index.js             # V7 implementation and exports
│       ├── create-folders.js    # Individual public re-export
│       ├── create-files.js      # Individual public re-export
│       ├── insert-content.js    # Individual public re-export
│       ├── hook-routes.js       # Individual public re-export
│       └── build.js             # Combined package build export
│
├── test/
│   └── v7/
│       ├── input/
│       │   ├── source-of-truth/
│       │   │   ├── tree.json
│       │   │   ├── routes.estree.json
│       │   │   └── openapi.json
│       │   ├── data/
│       │   └── api.json
│       ├── output/              # Generated locally; not committed
│       ├── create-folders.js
│       ├── create-files.js
│       ├── insert-content.js
│       ├── hook-routes.js
│       ├── build.js
│       └── v7.test.js
│
├── bin/
├── package.json
└── README.md
```

## V7 input model

### `tree.json`

`test/v7/input/source-of-truth/tree.json` describes the directory/file hierarchy and identifies the ESTree template file used for each `routes.js`.

Current example:

```json
{
  "api": {
    "routes.js": "routes.estree.json",
    "v1": {
      "routes.js": "routes.estree.json",
      "clinics": {
        "routes.js": "routes.estree.json"
      }
    }
  }
}
```

In this tree:

- Object nodes represent directories.
- String-valued entries represent files.
- The string value points to a definition file relative to `source-of-truth`.
- The tree is used by the folder, file, and content stages to determine output paths.

The intended design is that changing a directory name in `tree.json` should flow through to generated directory names and route connections. V7 currently derives child import paths and route paths from the tree's child names.

### `routes.estree.json`

This file contains an ESTree-compatible JavaScript AST template. The current template represents a basic Hono application:

```js
import { Hono } from "hono";

const app = new Hono();

export default app;
```

Astring converts the AST JSON into JavaScript source. V7 applies a small formatting pass for readable import spacing and blank lines.

### `openapi.json` and `api.json`

These files are present as API-design inputs/examples. **The current V7 pipeline does not yet generate CRUD handlers from OpenAPI or consume `api.json` to generate endpoint implementations.** That is a future stage, not a completed V7 capability.

## V7 processing stages

The stages are independent and can be run separately.

### 1. Create folders

`createFolders()` traverses `tree.json` and creates the directory nodes under the client's output directory.

### 2. Create files

`createFiles()` traverses the same tree and creates empty files for string-valued leaf entries. Existing files are not overwritten by this stage.

### 3. Insert default content

`insertContent()` traverses the tree, reads the referenced ESTree JSON definition, converts it to JavaScript using Astring, and writes the generated source into the corresponding output file.

This stage writes the template content to the generated files.

### 4. Hook child routes

`hookRoutes()` traverses the tree and identifies directories that contain both a `routes.js` entry and child directories with their own `routes.js`.

For each such parent, V7 derives:

- The child import path, such as `./v1/routes.js`.
- The child variable name, such as `v1Routes`.
- The mount path, such as `/v1`.
- The Hono registration call, such as `app.route("/v1", v1Routes)`.

The route imports and registrations are generated from the tree's child directory names. The hook stage checks that the generated parent file exists and has the expected default app export before writing the composed source.

**Implementation note:** V7 currently starts the hook composition from the referenced ESTree template and checks the existing generated file before writing. It does not yet parse and transform arbitrary user-edited JavaScript in the generated file. That read/parse/modify workflow is a future improvement.

## Running V7

Run commands from the repository root.

Install dependencies:

```bash
npm install
```

Run one task at a time:

```bash
npm run v7:folders
npm run v7:files
npm run v7:content
npm run v7:hooks
```

Run all stages in order:

```bash
npm run v7:build
```

Run the V7 automated tests:

```bash
npm run v7:test
```

Generated files are written to:

```text
test/v7/output/
```

The package implementation under `src/` is not the generation destination for these test commands.

## V7 combined test flow

The test-side `build.js` imports the `run()` functions from the individual test runners:

```js
import { run as createFolders } from "./create-folders.js";
import { run as createFiles } from "./create-files.js";
import { run as insertContent } from "./insert-content.js";
import { run as hookRoutes } from "./hook-routes.js";

export function run() {
    const foldersResult = createFolders();
    createFiles();
    insertContent();
    hookRoutes();

    return foldersResult;
}
```

Each individual runner exports `run()` and only executes automatically when invoked directly from the command line. This allows the same task to be run independently or composed into the combined flow.

## Public JavaScript API

The package root entry point (`src/index.js`) currently re-exports V7.

```js
import {
    createFolders,
    createFiles,
    insertContent,
    hookRoutes,
    build
} from "json-api-builder";
```

The functions accept an optional options object. The main option is `clientRoot`; by default it is the current working directory. Input is expected under `clientRoot/input`, and output defaults to `clientRoot/output`.

Example:

```js
import { build } from "json-api-builder";

build({
    clientRoot: "./my-client-project"
});
```

V7 also has direct subpath exports under `json-api-builder/v7`.

## Current scope and next development areas

Implemented in V7:

- Versioned source implementation and versioned test client.
- Reuse of `json-traversal-core` across the traversal stages.
- Folder creation from the tree.
- Non-destructive empty-file creation.
- ESTree template-to-JavaScript insertion using Astring.
- Tree-derived nested Hono route imports and registrations.
- Individual test runners and a combined runner that composes them.
- Automated checks for the stages, route hooks, and repeated hook execution.

Not implemented yet:

- Generating CRUD handlers from OpenAPI operations.
- Reading and transforming arbitrary existing JavaScript ASTs in-place.
- A complete semantic validation of the OpenAPI document against the generated route tree.
- A production-ready NPM CLI flow for selecting arbitrary client input paths. The V7 test scripts are the verified client workflow.

## Dependencies

- `json-traversal-core` — tree traversal.
- `astring` — JavaScript source generation from ESTree AST data.

## Development principle

The intended architecture is:

1. Keep project structure in a machine-readable tree.
2. Traverse that tree for each independent processing stage.
3. Keep each stage's filesystem or AST operation in its own function.
4. Let the client choose individual stages or compose them in sequence.
5. Generate JavaScript only after the structured representation has been prepared.

V7 is a working foundation for this approach, not yet the complete API generator.
