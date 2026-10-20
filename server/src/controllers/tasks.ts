import type { Context } from "hono";
import { db } from "../db";
import { tasks } from "../db/schema";
import { and, eq } from "drizzle-orm";
import type { Server } from "bun";

export const getTasks = async (c: Context) => {
  const userId = c.get("userId");
  const userTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.userId, userId))
    .all();

  return c.json(userTasks);
};

export const createTask = async (c: Context) => {
  const userId = c.get("userId");
  const { title, description, status } = await c.req.json();

  if (!title) {
    return c.json({ error: "Title is required" }, 400);
  }

  const newTask = await db
    .insert(tasks)
    .values({
      userId,
      title,
      description: description || null,
      status: status || "todo",
      position: 0,
    })
    .returning()
    .get();

  const server = c.env as unknown as Server<unknown>;
  server.publish(
    `tasks-user-${userId}`,
    JSON.stringify({ type: "TASK_CREATED", task: newTask })
  );

  return c.json(newTask, 201);
};

export const reorderTasks = async (c: Context) => {
  const userId = c.get("userId");
  const { reorderedTasks } = await c.req.json<{
    reorderedTasks: {
      id: number;
      status: "todo" | "in-progress" | "done";
      position: number;
    }[];
  }>();

  for (const item of reorderedTasks) {
    await db
      .update(tasks)
      .set({ status: item.status, position: item.position })
      .where(and(eq(tasks.id, item.id), eq(tasks.userId, userId)));
  }

  const server = c.env as unknown as Server<unknown>;
  server.publish(
    `tasks-user-${userId}`,
    JSON.stringify({ type: "TASKS_REORDERED", tasks: reorderedTasks })
  );

  return c.json({ success: true });
};

export const updateTask = async (c: Context) => {
  const userId = c.get("userId");
  const taskId = Number(c.req.param("id"));
  const body = await c.req.json();

  const updatedTask = await db
    .update(tasks)
    .set(body)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .returning()
    .get();

  if (!updatedTask) {
    return c.json({ error: "Task not found" }, 404);
  }

  const server = c.env as unknown as Server<unknown>;
  server.publish(
    `tasks-user-${userId}`,
    JSON.stringify({ type: "TASK_UPDATED", task: updatedTask })
  );

  return c.json(updatedTask);
};

export const deleteTask = async (c: Context) => {
  const userId = c.get("userId");
  const taskId = Number(c.req.param("id"));

  const deleted = await db
    .delete(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .returning()
    .get();

  if (!deleted) {
    return c.json({ error: "Task not found" }, 404);
  }

  const server = c.env as unknown as Server<unknown>;
  server.publish(
    `tasks-user-${userId}`,
    JSON.stringify({ type: "TASK_DELETED", taskId })
  );

  return c.json({ success: true });
};