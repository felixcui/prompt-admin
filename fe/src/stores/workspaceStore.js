import create from 'zustand';
import { persist } from 'zustand/middleware';

const useWorkspaceStore = create(
  persist(
    (set) => ({
      currentWorkspace: null,
      setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
    }),
    {
      name: 'workspace-storage',
    }
  )
);

export default useWorkspaceStore; 