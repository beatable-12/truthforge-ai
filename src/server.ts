import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { initializeDatabase, checkDatabaseHealth } from "./db-init";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;
let databaseInitialized = false;

async function initializeApp(): Promise<void> {
  if (databaseInitialized) {
    return;
  }

  try {
    console.log("[Server] Initializing TruthForge database...");
    const result = await initializeDatabase();
    if (result.success) {
      console.log(`[Server] ✓ Database initialized: ${result.tablesCreated} tables, ${result.indexesCreated} indexes`);
      databaseInitialized = true;
    } else {
      console.warn(`[Server] Database initialization warning: ${result.message}`);
    }
  } catch (error) {
    console.error("[Server] Database initialization failed:", error);
    throw error;
  }
}

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      // Initialize database on first request
      if (!databaseInitialized) {
        await initializeApp();
      }

      // Health check endpoint
      if (request.method === "GET" && new URL(request.url).pathname === "/api/health") {
        const health = checkDatabaseHealth();
        return new Response(
          JSON.stringify({
            status: health.healthy ? "healthy" : "degraded",
            database: health,
            timestamp: new Date().toISOString(),
          }),
          {
            status: health.healthy ? 200 : 503,
            headers: { "content-type": "application/json" },
          }
        );
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },
};
