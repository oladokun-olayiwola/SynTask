import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-in-prod";

export interface AuthContext {
  Variables: {
    userId: number;
    email: string;
    username: string;
  };
}

export const requireAuth = createMiddleware<AuthContext>(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }

const token = authHeader.split(" ")[1];

if (!token) {
  return c.json({ error: "Unauthorized: Missing token" }, 401);
}

  try {
    const payload = await verify(token, JWT_SECRET, 'HS256');
    c.set("userId", payload.userId as number);
    c.set("email", payload.email as string);
    c.set("username", payload.username as string);
    await next();
  } catch (err) {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
});