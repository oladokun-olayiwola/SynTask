export type TaskStatus = "todo" | "in-progress" | "done";

export interface Task {
  id: number;
  userId: number;
  title: string;
  description?: string | null;
  status: TaskStatus;
  position: number;
  createdAt: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  avatarColor: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
}