import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface AppState {
  userId: string | null;
  setUserId: (userId: string) => void;
  getOrCreateUserId: () => string;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Safe localStorage check
const isBrowser = typeof window !== "undefined";

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      userId: null,
      setUserId: (userId: string) => set({ userId }),
      getOrCreateUserId: () => {
        const current = get().userId;
        if (current) return current;
        const newId = generateUserId();
        set({ userId: newId });
        return newId;
      },
      theme: "light",
      setTheme: (theme: "light" | "dark") => set({ theme }),
      sidebarOpen: false,
      setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
      _hasHydrated: false,
      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
    }),
    {
      name: "invest-dashboard-storage",
      storage: createJSONStorage(() => {
        if (isBrowser) {
          return localStorage;
        }
        // Return a no-op storage for SSR
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Hook to check if store has hydrated
export const useHasHydrated = () => {
  return useAppStore((state) => state._hasHydrated);
};
