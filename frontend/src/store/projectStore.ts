import { create } from 'zustand';
import { projectsApi } from '../api/projects';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  createdBy?: { firstName: string; lastName: string };
}

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;

  fetchProjects: (orgId: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  createProject: (orgId: string, data: { name: string; description?: string }) => Promise<void>;
  updateProject: (orgId: string, id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (orgId: string, id: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,

  fetchProjects: async (orgId) => {
    set({ isLoading: true });
    try {
      const response = await projectsApi.list(orgId);
      set({ projects: response.data.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  setCurrentProject: (project) => set({ currentProject: project }),

  createProject: async (orgId, data) => {
    await projectsApi.create(orgId, data);
    await get().fetchProjects(orgId);
  },

  updateProject: async (orgId, id, data) => {
    await projectsApi.update(orgId, id, data);
    await get().fetchProjects(orgId);
  },

  deleteProject: async (orgId, id) => {
    await projectsApi.delete(orgId, id);
    await get().fetchProjects(orgId);
  },
}));
