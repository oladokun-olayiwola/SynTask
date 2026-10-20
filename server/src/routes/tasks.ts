import { Hono } from "hono";
import {
  getTasks,
  createTask,
  reorderTasks,
  updateTask,
  deleteTask,
} from "../controllers/tasks";
import { type AuthContext, requireAuth } from "../middleware/auth";

export const taskRoutes = new Hono<AuthContext>();

taskRoutes.use("/*", requireAuth);

taskRoutes.get("/", getTasks);
taskRoutes.post("/", createTask);
taskRoutes.patch("/reorder", reorderTasks);
taskRoutes.patch("/:id", updateTask);
taskRoutes.delete("/:id", deleteTask);