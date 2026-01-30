import { create } from 'zustand';
import { generateId } from '@/utils';
import { loadTabState, saveTabState } from '@/services/tabStateService';

/** Home page special identifier */
export const HOME_PAGE_ID = '__home__';

/** Component detail page fixed ID (all component details share one tab) */
export const COMPONENT_DETAIL_TAB_ID = '__component_detail__';

/** Developer tools page fixed ID */
export const DEV_TOOLS_TAB_ID = '__dev_tools__';

/** Graph view page fixed ID */
export const GRAPH_TAB_ID = '__graph__';

/** Tab data structure */
export interface Tab {
  /** Tab unique identifier */
  id: string;
  /** Associated page ID */
  pageId: string;
  /** Tab title */
  title: string;
  /** Icon */
  icon?: string;
  /** Icon type */
  iconType?: 'lucide' | 'emoji';
}

/** Recent visit record */
export interface RecentVisit {
  pageId: string;
  title: string;
  icon?: string;
  iconType?: 'lucide' | 'emoji';
  visitedAt: string;
}

interface TabState {
  /** Open tabs list */
  tabs: Tab[];
  /** Currently active tab ID */
  activeTabId: string | null;
  /** Maximum number of tabs */
  maxTabs: number;
  /** Recent visit records */
  recentVisits: RecentVisit[];
  /** Maximum recent visits count */
  maxRecentVisits: number;
  /** Tab visit history (for forward/back navigation) */
  tabHistory: string[];
  /** Current position in history */
  historyIndex: number;

  // Actions
  /** Open tab (switch to existing tab if already open) */
  openTab: (pageId: string, title: string, icon?: string, iconType?: 'lucide' | 'emoji') => void;
  /** Open home tab */
  openHomeTab: () => void;
  /** Go back */
  goBack: () => void;
  /** Go forward */
  goForward: () => void;
  /** Can go back */
  canGoBack: () => boolean;
  /** Can go forward */
  canGoForward: () => boolean;
  /** Close tab */
  closeTab: (tabId: string) => void;
  /** Set active tab */
  setActiveTab: (tabId: string) => void;
  /** Update tab title */
  updateTabTitle: (tabId: string, title: string) => void;
  /** Update tab icon */
  updateTabIcon: (tabId: string, icon?: string, iconType?: 'lucide' | 'emoji') => void;
  /** Close all tabs */
  closeAllTabs: () => void;
  /** Close other tabs */
  closeOtherTabs: (tabId: string) => void;
  /** Close tabs to the right */
  closeTabsToRight: (tabId: string) => void;
  /** Get active tab's pageId */
  getActivePageId: () => string | null;
  /** Find tab by pageId */
  findTabByPageId: (pageId: string) => Tab | undefined;
  /** Add recent visit record */
  addRecentVisit: (pageId: string, title: string, icon?: string, iconType?: 'lucide' | 'emoji') => void;
  /** Clear recent visit records */
  clearRecentVisits: () => void;
}

/**
 * Selector: Get current active pageId
 * Usage: const activePageId = useActivePageId();
 */
export function useActivePageId(): string | null {
  return useTabStore((state) => {
    if (!state.activeTabId) return null;
    const activeTab = state.tabs.find((tab) => tab.id === state.activeTabId);
    return activeTab?.pageId ?? null;
  });
}

export const useTabStore = create<TabState>()((set, get) => ({
  tabs: [],
  activeTabId: null,
  maxTabs: 10,
  recentVisits: [],
  maxRecentVisits: 10,
  tabHistory: [],
  historyIndex: -1,

  openTab: (pageId, title, icon, iconType) => {
    const { tabs, maxTabs, addRecentVisit, tabHistory, historyIndex } = get();

    // Check if tab for this page already exists
    const existingTab = tabs.find((tab) => tab.pageId === pageId);
    if (existingTab) {
      // Switch to existing tab
      // Update history
      const newHistory = tabHistory.slice(0, historyIndex + 1);
      if (newHistory[newHistory.length - 1] !== existingTab.id) {
        newHistory.push(existingTab.id);
      }
      set({
        activeTabId: existingTab.id,
        tabHistory: newHistory,
        historyIndex: newHistory.length - 1,
      });
      // Add recent visit record (not for home page)
      if (pageId !== HOME_PAGE_ID) {
        addRecentVisit(pageId, title, icon, iconType);
      }
      return;
    }

    // Check if max tabs reached
    if (tabs.length >= maxTabs) {
      // Close leftmost tab (but not home page)
      const homeTabIndex = tabs.findIndex((tab) => tab.pageId === HOME_PAGE_ID);
      const tabsToFilter = homeTabIndex === 0 ? tabs.slice(1) : tabs;
      const newTabs = tabsToFilter.slice(homeTabIndex === 0 ? 0 : 1);
      if (homeTabIndex === 0) {
        newTabs.unshift(tabs[0]);
      }

      const newTab: Tab = {
        id: generateId(),
        pageId,
        title,
        icon,
        iconType,
      };
      set({
        tabs: [...newTabs, newTab],
        activeTabId: newTab.id,
      });
      // Add recent visit record (not for home page)
      if (pageId !== HOME_PAGE_ID) {
        addRecentVisit(pageId, title, icon, iconType);
      }
      return;
    }

    // Create new tab
    const newTab: Tab = {
      id: generateId(),
      pageId,
      title,
      icon,
      iconType,
    };

    // Update history
    const newHistory = tabHistory.slice(0, historyIndex + 1);
    newHistory.push(newTab.id);

    set({
      tabs: [...tabs, newTab],
      activeTabId: newTab.id,
      tabHistory: newHistory,
      historyIndex: newHistory.length - 1,
    });

    // 添加最近访问记录（非主页）
    if (pageId !== HOME_PAGE_ID) {
      addRecentVisit(pageId, title, icon, iconType);
    }
  },

  openHomeTab: () => {
    const { openTab } = get();
    openTab(HOME_PAGE_ID, 'Home', 'Home', 'lucide');
  },

  goBack: () => {
    const { tabHistory, historyIndex, tabs } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const tabId = tabHistory[newIndex];
      // Ensure tab still exists
      const tabExists = tabs.some((t) => t.id === tabId);
      if (tabExists) {
        set({
          activeTabId: tabId,
          historyIndex: newIndex,
        });
      }
    }
  },

  goForward: () => {
    const { tabHistory, historyIndex, tabs } = get();
    if (historyIndex < tabHistory.length - 1) {
      const newIndex = historyIndex + 1;
      const tabId = tabHistory[newIndex];
      // Ensure tab still exists
      const tabExists = tabs.some((t) => t.id === tabId);
      if (tabExists) {
        set({
          activeTabId: tabId,
          historyIndex: newIndex,
        });
      }
    }
  },

  canGoBack: () => {
    const { historyIndex } = get();
    return historyIndex > 0;
  },

  canGoForward: () => {
    const { tabHistory, historyIndex } = get();
    return historyIndex < tabHistory.length - 1;
  },

  closeTab: (tabId) => {
    const { tabs, activeTabId } = get();
    const tabIndex = tabs.findIndex((tab) => tab.id === tabId);

    if (tabIndex === -1) return;

    const newTabs = tabs.filter((tab) => tab.id !== tabId);

    // If closing the active tab, switch to another tab
    let newActiveTabId = activeTabId;
    if (activeTabId === tabId) {
      if (newTabs.length === 0) {
        newActiveTabId = null;
      } else if (tabIndex >= newTabs.length) {
        // Closing the last one, switch to previous
        newActiveTabId = newTabs[newTabs.length - 1].id;
      } else {
        // Switch to next at same position
        newActiveTabId = newTabs[tabIndex].id;
      }
    }

    set({
      tabs: newTabs,
      activeTabId: newActiveTabId,
    });
  },

  setActiveTab: (tabId) => {
    set({ activeTabId: tabId });
  },

  updateTabTitle: (tabId, title) => {
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === tabId ? { ...tab, title } : tab
      ),
    }));
  },

  updateTabIcon: (tabId, icon, iconType) => {
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === tabId ? { ...tab, icon, iconType } : tab
      ),
    }));
  },

  closeAllTabs: () => {
    set({ tabs: [], activeTabId: null });
  },

  closeOtherTabs: (tabId) => {
    const { tabs } = get();
    const targetTab = tabs.find((tab) => tab.id === tabId);
    if (targetTab) {
      set({
        tabs: [targetTab],
        activeTabId: tabId,
      });
    }
  },

  closeTabsToRight: (tabId) => {
    const { tabs, activeTabId } = get();
    const tabIndex = tabs.findIndex((tab) => tab.id === tabId);
    if (tabIndex === -1) return;

    const newTabs = tabs.slice(0, tabIndex + 1);

    // If active tab was closed, switch to target tab
    const activeStillExists = newTabs.some((tab) => tab.id === activeTabId);
    const newActiveTabId = activeStillExists ? activeTabId : tabId;

    set({
      tabs: newTabs,
      activeTabId: newActiveTabId,
    });
  },

  getActivePageId: () => {
    const { tabs, activeTabId } = get();
    if (!activeTabId) return null;
    const activeTab = tabs.find((tab) => tab.id === activeTabId);
    return activeTab?.pageId ?? null;
  },

  findTabByPageId: (pageId) => {
    return get().tabs.find((tab) => tab.pageId === pageId);
  },

  addRecentVisit: (pageId, title, icon, iconType) => {
    const { recentVisits, maxRecentVisits } = get();

    // Remove existing record for same page
    const filtered = recentVisits.filter((v) => v.pageId !== pageId);

    // Add new record at the beginning
    const newVisit: RecentVisit = {
      pageId,
      title,
      icon,
      iconType,
      visitedAt: new Date().toISOString(),
    };

    // Limit count
    const newVisits = [newVisit, ...filtered].slice(0, maxRecentVisits);

    set({ recentVisits: newVisits });
  },

  clearRecentVisits: () => {
    set({ recentVisits: [] });
  },
}));

// Subscribe to state changes, auto-save to file
useTabStore.subscribe((state) => {
  const data = {
    tabs: state.tabs,
    activeTabId: state.activeTabId,
    recentVisits: state.recentVisits,
  };
  saveTabState(data);
});

// Initialize: load state from file
export async function initTabStore() {
  const data = await loadTabState();
  if (data) {
    useTabStore.setState({
      tabs: data.tabs,
      activeTabId: data.activeTabId,
      recentVisits: data.recentVisits,
    });
  }
}
