import { create } from 'zustand';
import { tasksApi } from '../api/tasks';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  projectId: string;
  assigneeId?: string;
  assignee?: { firstName: string; lastName: string; email: string };
  dueDate?: string;
  createdAt: string;
}

interface TaskState {
  tasks: Task[];
  isLoading: boolean;

  fetchTasks: (orgId: string, projectId: string) => Promise<void>;
  createTask: (orgId: string, data: Partial<Task>) => Promise<void>;
  updateTask: (orgId: string, id: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (orgId: string, id: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,

  fetchTasks: async (orgId, projectId) => {
    set({ isLoading: true });
    try {
      const response = await tasksApi.list(orgId, projectId);
      set({ tasks: response.data.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  createTask: async (orgId, data) => {
    await tasksApi.create(orgId, data);
    if (data.projectId) {
      await get().fetchTasks(orgId, data.projectId);
    }
  },

  updateTask: async (orgId, id, data) => {
    await tasksApi.update(orgId, id, data);
    if (data.projectId) {
      await get().fetchTasks(orgId, data.projectId);
    }
  },

  deleteTask: async (orgId, id) => {
    await tasksApi.delete(orgId, id);
  },
}));
