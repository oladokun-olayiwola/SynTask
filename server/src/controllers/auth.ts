import type { Context } from "hono";
import { sign } from "hono/jwt";
import { db } from "../db";
import { users } from "../db/schema";
import { eq, or } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-in-prod";

const AVATAR_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
];

const getRandomColor = () =>
  AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

export const registerUser = async (c: Context) => {
  const { email, username, password } = await c.req.json();

  if (!email || !username || !password || password.length < 6) {
    return c.json(
      { error: "Email, username, and 6+ char password required" },
      400
    );
  }

  const existing = await db
    .select()
    .from(users)
    .where(or(eq(users.email, email), eq(users.username, username)))
    .get();

  if (existing) {
    const field = existing.email === email ? "Email" : "Username";
    return c.json({ error: `${field} is already taken` }, 400);
  }

  const passwordHash = await Bun.password.hash(password, {
    algorithm: "bcrypt",
    cost: 10,
  });

  const avatarColor = getRandomColor();

  const [newUser] = await db
    .insert(users)
    .values({
      email,
      username,
      passwordHash,
      avatarColor,
    })
    .returning();

     if (!newUser) {
    return c.json({ error: "Failed to create user" }, 500);
  }


  const token = await sign(
    { userId: newUser.id, email: newUser.email, username: newUser.username },
    JWT_SECRET
  );

  return c.json(
    {
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        avatarColor: newUser.avatarColor,
      },
    },
    201
  );
};

export const loginUser = async (c: Context) => {
  const { identifier, password } = await c.req.json();

  if (!identifier || !password) {
    return c.json({ error: "Username/email and password required" }, 400);
  }

  const user = await db
    .select()
    .from(users)
    .where(or(eq(users.email, identifier), eq(users.username, identifier)))
    .get();

  if (!user) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const isValid = await Bun.password.verify(password, user.passwordHash);
  if (!isValid) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const token = await sign(
    { userId: user.id, email: user.email, username: user.username },
    JWT_SECRET
  );

  return c.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      avatarColor: user.avatarColor,
    },
  });
};