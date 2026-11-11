import { serve } from "@hono/node-server";

export function startServer(app, options = {}) {
    const port = Number(options.port ?? process.env.PORT ?? 3000);
    if (!Number.isInteger(port) || port < 0 || port > 65535) {
        throw new Error(`Invalid server port: ${options.port}`);
    }
    const server = serve({ fetch: app.fetch, port, hostname: options.hostname ?? "127.0.0.1" });
    return server;
}
