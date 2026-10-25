import { useState, useEffect, useCallback } from "react";
import type { Task, TaskStatus } from "../types/task";
import { useAuth } from "../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api/tasks";

export const useTasks = () => {
  const { token, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getHeaders = useCallback(() => {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  const fetchTasks = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(API_BASE, { headers: getHeaders() });

      if (res.status === 401) {
        logout();
        return;
      }

      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      setTasks(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, getHeaders, logout]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = async (title: string, description?: string, status: TaskStatus = "todo") => {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ title, description, status }),
    });
    if (!res.ok) throw new Error("Failed to create task");
    
    const newTask = await res.json();

    // Immediately update local UI state
    setTasks((prev) => {
      if (prev.some((t) => t.id === newTask.id)) return prev;
      return [...prev, newTask];
    });

    return newTask;
  };

  const updateTask = async (id: number, title?: string, description?: string, updates?: Partial<Task>) => {
    const payload = updates ? updates : { title, description };
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update task");

    const updatedTask = await res.json();

    // Immediately update local UI state
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );

    return updatedTask;
  };

  const reorderTasks = async (
    reorderedTasks: { id: number; status: TaskStatus; position: number }[]
  ) => {
    const res = await fetch(`${API_BASE}/reorder`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ reorderedTasks }),
    });
    if (!res.ok) throw new Error("Failed to reorder tasks");
  };

  const deleteTask = async (id: number) => {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete task");

    // Immediately remove from local UI state
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleWebSocketMessage = useCallback((data: any) => {
    switch (data.type) {
      case "TASK_CREATED":
        setTasks((prev) => {
          if (prev.some((t) => t.id === data.task.id)) return prev;
          return [...prev, data.task];
        });
        break;
      case "TASK_UPDATED":
        setTasks((prev) =>
          prev.map((t) => (t.id === data.task.id ? data.task : t))
        );
        break;
      case "TASKS_REORDERED":
        setTasks((prev) => {
          const map = new Map<number, { id: number; status: TaskStatus; position: number }>(
            data.tasks.map((item: any) => [item.id, item])
          );
          return prev.map((t) => {
            const updated = map.get(t.id);
            return updated ? { ...t, status: updated.status, position: updated.position } : t;
          });
        });
        break;
      case "TASK_DELETED":
        setTasks((prev) => prev.filter((t) => t.id !== data.taskId));
        break;
      default:
        break;
    }
  }, []);

  const handleDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;

    const taskId = Number(draggableId);
    const updatedTasks = Array.from(tasks);
    const taskIndex = updatedTasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return;

    const [movedTask] = updatedTasks.splice(taskIndex, 1);
    movedTask.status = destination.droppableId as TaskStatus;

    const columnTasks = updatedTasks
      .filter((t) => t.status === destination.droppableId)
      .sort((a, b) => a.position - b.position);

    columnTasks.splice(destination.index, 0, movedTask);

    const reorderedPayload = columnTasks.map((t, idx) => ({
      id: t.id,
      status: t.status,
      position: idx,
    }));

    // Optimistic UI update for card movements
    setTasks((prev) =>
      prev.map((t) => {
        const item = reorderedPayload.find((p) => p.id === t.id);
        return item ? { ...t, status: item.status, position: item.position } : t;
      })
    );

    try {
      await reorderTasks(reorderedPayload);
    } catch {
      fetchTasks(); // Revert state on API error
    }
  };

  return {
    tasks,
    setTasks,
    isLoading: loading,
    errorMessage: error,
    createTask,
    updateTask,
    reorderTasks,
    deleteTask,
    handleWebSocketMessage,
    handleDragEnd,
    refetch: fetchTasks,
  };
};