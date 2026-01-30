import { create } from 'zustand';
import { loadUIState, saveUIState } from '@/services/uiStateService';

/** Navigation item type */
export type NavItem = 'home' | 'files' | 'graph' | 'loreAI' | 'components' | 'devTools' | 'trash';

interface UIState {
  /** Whether sidebar is expanded */
  sidebarOpen: boolean;
  /** Sidebar width */
  sidebarWidth: number;
  /** Theme */
  theme: 'light' | 'dark' | 'system';
  /** Currently active navigation item */
  activeNav: NavItem;
  /** Currently active navigation panel (null means panel is closed) */
  activeNavPanel: NavItem | null;
  /** Secondary panel width */
  secondaryPanelWidth: number;
  /** Components panel width */
  componentsPanelWidth: number;
  /** Whether right panel is expanded */
  rightPanelOpen: boolean;
  /** Right panel width */
  rightPanelWidth: number;
  /** Currently displayed modal */
  activeModal: string | null;
  /** Modal data */
  modalData: unknown;
  /** Floating toolbar position */
  floatingToolbarPosition: { x: number; y: number } | null;

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarWidth: (width: number) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setActiveNav: (nav: NavItem) => void;
  setActiveNavPanel: (panel: NavItem | null) => void;
  toggleNavPanel: (nav: NavItem) => void;
  setSecondaryPanelWidth: (width: number) => void;
  setComponentsPanelWidth: (width: number) => void;
  toggleRightPanel: () => void;
  setRightPanelOpen: (open: boolean) => void;
  openModal: (modalId: string, data?: unknown) => void;
  closeModal: () => void;
  setFloatingToolbarPosition: (position: { x: number; y: number } | null) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: true,
  sidebarWidth: 260,
  theme: 'light',
  activeNav: 'home',
  activeNavPanel: null,
  secondaryPanelWidth: 240,
  componentsPanelWidth: 380,
  rightPanelOpen: true,
  rightPanelWidth: 280,
  activeModal: null,
  modalData: null,
  floatingToolbarPosition: null,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setSidebarWidth: (sidebarWidth) => set({ sidebarWidth }),
  setTheme: (theme) => set({ theme }),
  setActiveNav: (activeNav) => set({ activeNav }),
  setActiveNavPanel: (activeNavPanel) => set({ activeNavPanel }),
  toggleNavPanel: (nav) =>
    set((state) => ({
      activeNav: nav,
      activeNavPanel: state.activeNavPanel === nav ? null : nav,
    })),
  setSecondaryPanelWidth: (secondaryPanelWidth) => set({ secondaryPanelWidth }),
  setComponentsPanelWidth: (componentsPanelWidth) => set({ componentsPanelWidth }),
  toggleRightPanel: () => set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),
  setRightPanelOpen: (rightPanelOpen) => set({ rightPanelOpen }),
  openModal: (activeModal, modalData = null) => set({ activeModal, modalData }),
  closeModal: () => set({ activeModal: null, modalData: null }),
  setFloatingToolbarPosition: (floatingToolbarPosition) => set({ floatingToolbarPosition }),
}));

// Subscribe to state changes, auto-save to file
useUIStore.subscribe((state) => {
  const data = {
    sidebarOpen: state.sidebarOpen,
    sidebarWidth: state.sidebarWidth,
    theme: state.theme,
    activeNav: state.activeNav,
    secondaryPanelWidth: state.secondaryPanelWidth,
    componentsPanelWidth: state.componentsPanelWidth,
    rightPanelOpen: state.rightPanelOpen,
    rightPanelWidth: state.rightPanelWidth,
  };
  saveUIState(data);
});

// Initialize: load state from file
export async function initUIStore() {
  const data = await loadUIState();
  if (data) {
    useUIStore.setState(data);
  }
}
