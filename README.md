# JSON API Builder V2

A single-project JSON-to-Hono API generator. The API definition lives in `input/api.json`; `npm run build` generates the route tree, route imports/mounts, CRUD handlers, data files, and server entry point under `output/`.

## Quick start

```bash
npm install
npm run build
npm run check
npm test
npm start
```

Open `http://localhost:3000/api/v1/clinics`.

## CRUD endpoints

| Method | URL | Purpose |
|---|---|---|
| GET | `/api/v1/clinics` | List clinics |
| POST | `/api/v1/clinics` | Create clinic |
| GET | `/api/v1/clinics/:id` | Read one clinic |
| PUT | `/api/v1/clinics/:id` | Update clinic |
| DELETE | `/api/v1/clinics/:id` | Delete clinic |

Example create body:

```json
{ "name": "New Clinic", "location": "Kakinada" }
```

The ID is generated when omitted. Data is persisted in `output/data/clinics.json`.

## Project layout

- `input/api.json`: route/resource definition and endpoint operations.
- `input/data/`: seed JSON files copied into generated output on each build.
- `src/`: generator/orchestration.
- `output/`: generated Hono application; recreated on every build.
- `scripts/`: output syntax checker.
- `test/`: end-to-end CRUD test.

**Important:** `npm run build` recreates `output/` and copies seed data from `input/data/`. Back up runtime data before rebuilding if you need to retain changes.
