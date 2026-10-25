import { Hono } from "hono";
import { cors } from "hono/cors";
import { upgradeWebSocket } from "@hono/bun";
import { verify } from "hono/jwt";
import type { ServerWebSocket } from "bun";
import { authRoutes } from "./routes/auth";
import { taskRoutes } from "./routes/tasks";

const app = new Hono();

const JWT_SECRET = process.env.JWT_SECRET!;
const ALLOWED_ORIGINS = [
  "https://syn-task.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
];

// CORS Middleware
app.use(
  "/*",
  cors({
    origin: (origin) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin) || process.env.CLIENT_ORIGIN === "*") {
        return origin || "*";
      }
      return process.env.CLIENT_ORIGIN || "https://syn-task.vercel.app";
    },
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// WebSocket Gateway Route (Must be explicitly defined on root app)
app.get(
  "/ws",
  upgradeWebSocket((c) => {
    const token = c.req.query("token");

    return {
      async onOpen(_event, ws) {
        if (!token) {
          ws.close(4001, "Unauthorized: Token missing");
          return;
        }

        try {
          const payload = await verify(token, JWT_SECRET, "HS256");
          const userId = payload.userId as number;

          const rawSocket = ws.raw as ServerWebSocket;
          rawSocket?.subscribe(`tasks-user-${userId}`);
        } catch {
          ws.close(4001, "Unauthorized: Invalid token");
        }
      },
    };
  })
);

// 3. Mount REST API Routers
app.route("/api/auth", authRoutes);
app.route("/api/tasks", taskRoutes);

const PORT = Number(process.env.PORT) || 4000;

const server = Bun.serve({
  port: PORT,
  fetch: app.fetch,
  websocket: {
    open() {},
    message() {},
    close() {},
  },
});

export default server;