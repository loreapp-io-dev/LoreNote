import { useState, useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { FolderOpen, Plus, Trash2, Clock, Globe, Info, Check, Settings, AlertTriangle, TriangleAlert } from 'lucide-react';
import type { VaultRegistryEntry } from '@/types';
import {
  getRegisteredVaults,
  selectVaultLocation,
  selectExistingVault,
  createVault,
  openVault,
  isValidVault,
  removeVaultFromRegistry,
  deleteVaultData,
} from '@/services/vaultService';
import { useVaultStore, useSettingsStore } from '@/stores';
import { useI18n } from '@/i18n';
import { useVault } from '../hooks/useVault';
import { APP_VERSION } from '@/constants/version';

interface VaultSelectorProps {
  onVaultOpen: () => void;
}

export function VaultSelector({ onVaultOpen }: VaultSelectorProps) {
  const [vaults, setVaults] = useState<VaultRegistryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newVaultName, setNewVaultName] = useState('');
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<VaultRegistryEntry | null>(null);
  const [deleteWithData, setDeleteWithData] = useState(false);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);

  const { setVaults: setStoreVaults, addVault } = useVaultStore();
  const { openSettings } = useSettingsStore();
  const { t, locale, setLocale, supportedLocales } = useI18n();
  const { switchVault } = useVault();

  // Window controls
  const handleClose = async () => {
    await getCurrentWindow().close();
  };

  const handleMinimize = async () => {
    await getCurrentWindow().minimize();
  };

  const handleMaximize = async () => {
    const window = getCurrentWindow();
    const isMaximized = await window.isMaximized();
    if (isMaximized) {
      await window.unmaximize();
    } else {
      await window.maximize();
    }
  };

  // Load registered vault list
  useEffect(() => {
    loadVaults();
  }, []);

  const loadVaults = async () => {
    setIsLoading(true);
    try {
      const registeredVaults = await getRegisteredVaults();
      setVaults(registeredVaults);
      setStoreVaults(registeredVaults);
    } catch (err) {
      console.error('Failed to load vaults:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Open existing vault
  const handleOpenVault = async (entry: VaultRegistryEntry) => {
    setError(null);
    try {
      const success = await switchVault(entry.id);
      if (success) {
        onVaultOpen();
      } else {
        setError(`${t.vault.openFailed}: ${entry.name}`);
      }
    } catch (err) {
      setError(t.vault.openFailed);
      console.error(err);
    }
  };

  // Browse folder to open vault
  const handleBrowseVault = async () => {
    setError(null);
    try {
      const path = await selectExistingVault();
      if (!path) return;

      // Check if it's a valid vault
      const valid = await isValidVault(path);
      if (valid) {
        const vault = await openVault(path);
        if (vault) {
          addVault({
            id: vault.id,
            name: vault.name,
            path: vault.path,
            addedAt: new Date().toISOString(),
            lastOpenedAt: new Date().toISOString(),
          });
          // Use switchVault to load pages and folders
          await switchVault(vault.id, vault);
          onVaultOpen();
        }
      } else {
        // Not a valid vault, switch to create mode
        setSelectedPath(path);
        setNewVaultName(path.split('/').pop() || t.common.untitled);
        setIsCreating(true);
      }
    } catch (err) {
      setError(t.vault.selectFolderFailed);
      console.error(err);
    }
  };

  // Select location to create new vault
  const handleSelectLocation = async () => {
    setError(null);
    try {
      const path = await selectVaultLocation();
      if (path) {
        setSelectedPath(path);
        setNewVaultName(path.split('/').pop() || t.common.untitled);
      }
    } catch (err) {
      setError(t.vault.selectFolderFailed);
      console.error(err);
    }
  };

  // Create new vault
  const handleCreateVault = async () => {
    if (!selectedPath || !newVaultName.trim()) return;

    setError(null);
    try {
      const vault = await createVault(selectedPath, newVaultName.trim());
      if (vault) {
        addVault({
          id: vault.id,
          name: vault.name,
          path: vault.path,
          addedAt: new Date().toISOString(),
          lastOpenedAt: new Date().toISOString(),
        });
        // Use switchVault to initialize pages and folders
        await switchVault(vault.id, vault);
        onVaultOpen();
      } else {
        setError(t.vault.createFailed);
      }
    } catch (err) {
      setError(t.vault.createFailed);
      console.error(err);
    }
  };

  // Open delete confirmation dialog
  const handleRemoveVault = (e: React.MouseEvent, vault: VaultRegistryEntry) => {
    e.stopPropagation();
    setDeleteConfirm(vault);
    setDeleteWithData(false);
  };

  // Confirm delete vault
  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteWithData) {
        await deleteVaultData(deleteConfirm.path);
      }
      await removeVaultFromRegistry(deleteConfirm.id);
      await loadVaults();
      setDeleteConfirm(null);
      setDeleteWithData(false);
    } catch (err) {
      console.error('Failed to remove vault:', err);
    }
  };

  // Cancel create
  const handleCancelCreate = () => {
    setIsCreating(false);
    setSelectedPath(null);
    setNewVaultName('');
    setError(null);
  };

  // Format relative time
  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSeconds < 10) {
      return t.relativeTime.justNow;
    } else if (diffSeconds < 60) {
      return t.relativeTime.secondsAgo.replace('{count}', String(diffSeconds));
    } else if (diffMinutes === 1) {
      return t.relativeTime.minuteAgo;
    } else if (diffMinutes < 60) {
      return t.relativeTime.minutesAgo.replace('{count}', String(diffMinutes));
    } else if (diffHours === 1) {
      return t.relativeTime.hourAgo;
    } else if (diffHours < 24) {
      return t.relativeTime.hoursAgo.replace('{count}', String(diffHours));
    } else if (diffDays === 1) {
      return t.relativeTime.dayAgo;
    } else if (diffDays < 7) {
      return t.relativeTime.daysAgo.replace('{count}', String(diffDays));
    } else if (diffWeeks === 1) {
      return t.relativeTime.weekAgo;
    } else if (diffWeeks < 4) {
      return t.relativeTime.weeksAgo.replace('{count}', String(diffWeeks));
    } else if (diffMonths === 1) {
      return t.relativeTime.monthAgo;
    } else if (diffMonths < 12) {
      return t.relativeTime.monthsAgo.replace('{count}', String(diffMonths));
    } else if (diffYears === 1) {
      return t.relativeTime.yearAgo;
    } else {
      return t.relativeTime.yearsAgo.replace('{count}', String(diffYears));
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-neutral-50 dark:bg-[#1e1e1e]">
        <div className="text-neutral-500 dark:text-[#888]">{t.common.loading}</div>
      </div>
    );
  }

  return (
    <div className="window-container relative flex h-screen w-screen flex-col overflow-hidden">
      {/* Background layer */}
      <div className="absolute inset-0 rounded-[10px] bg-neutral-50 dark:bg-[#1e1e1e]" />
      {/* Title bar - draggable */}
      <div
        className="relative z-10 flex h-11 shrink-0 items-center rounded-t-[10px] border-b border-neutral-200/80 bg-neutral-100/80 px-3 dark:border-[#333] dark:bg-[#2a2a2a]"
        data-tauri-drag-region="true"
      >
        {/* Window control buttons */}
        <div
          className="flex items-center gap-2"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Close button - red */}
          <button
            onClick={handleClose}
            className="group flex h-3 w-3 items-center justify-center rounded-full bg-[#FF5F57] transition-colors hover:bg-[#FF5F57]/80"
            title="Close"
          >
            {isHovered && (
              <svg
                className="h-2 w-2 text-[#4D0000]"
                viewBox="0 0 10 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M2 2l6 6M8 2l-6 6" />
              </svg>
            )}
          </button>

          {/* Minimize button - yellow */}
          <button
            onClick={handleMinimize}
            className="group flex h-3 w-3 items-center justify-center rounded-full bg-[#FEBC2E] transition-colors hover:bg-[#FEBC2E]/80"
            title="Minimize"
          >
            {isHovered && (
              <svg
                className="h-2 w-2 text-[#995700]"
                viewBox="0 0 10 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M2 5h6" />
              </svg>
            )}
          </button>

          {/* Maximize button - green */}
          <button
            onClick={handleMaximize}
            className="group flex h-3 w-3 items-center justify-center rounded-full bg-[#28C840] transition-colors hover:bg-[#28C840]/80"
            title="Maximize"
          >
            {isHovered && (
              <svg
                className="h-2 w-2 text-[#006500]"
                viewBox="0 0 10 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M2 3.5L5 1l3 2.5M2 6.5L5 9l3-2.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-1 overflow-hidden">
        {/* Left - vault list */}
        <div className="flex w-56 flex-col rounded-bl-[10px] border-r border-neutral-200/60 bg-white/90 dark:border-[#333] dark:bg-[#252525]/95">
        {/* Vault list */}
        <div className="flex-1 overflow-y-auto p-1.5">
          {vaults.length === 0 ? (
            <div className="px-2 py-8 text-center text-sm text-neutral-400 dark:text-[#666]">
              {t.vault.noVaults}
            </div>
          ) : (
            <div className="space-y-0.5">
              {vaults.map((vault) => (
                <div
                  key={vault.id}
                  className="group relative"
                  onMouseEnter={() => setHoveredPath(vault.id)}
                  onMouseLeave={() => setHoveredPath(null)}
                >
                  <div
                    onClick={() => handleOpenVault(vault)}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-neutral-100 dark:hover:bg-[#383838]"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleOpenVault(vault);
                      }
                    }}
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-neutral-100 text-neutral-500 group-hover:bg-neutral-200 dark:bg-[#333] dark:text-[#777] dark:group-hover:bg-[#404040]">
                      <FolderOpen size={12} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] text-neutral-700 dark:text-[#dcddde]">
                        {vault.name}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-neutral-400 dark:text-[#666]">
                        <Clock size={8} />
                        <span>{formatTime(vault.lastOpenedAt)}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleRemoveVault(e, vault)}
                      className="shrink-0 rounded p-0.5 text-neutral-400 opacity-0 transition-opacity hover:bg-neutral-200 hover:text-red-500 group-hover:opacity-100 dark:text-[#666] dark:hover:bg-[#404040] dark:hover:text-red-400"
                      title={t.vault.removeFromList}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  {/* Hover tooltip - show path only */}
                  {hoveredPath === vault.id && (
                    <div className="absolute left-full top-0 z-50 ml-2 max-w-xs rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-lg dark:border-[#404040] dark:bg-[#2b2b2b]">
                      <div className="text-xs font-medium text-neutral-500 dark:text-[#888]">{t.vault.location}</div>
                      <div className="mt-1 break-all text-xs text-neutral-700 dark:text-[#ccc]">{vault.path}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right - action area */}
      <div className="flex flex-1 flex-col items-center justify-center p-2">
        {isCreating ? (
          // Create new vault form
          <div className="w-full max-w-xs rounded-xl border border-neutral-200 bg-white p-3 shadow-sm dark:border-[#333] dark:bg-[#252525]">
            <h2 className="mb-3 text-base font-semibold text-neutral-800 dark:text-[#dcddde]">
              {t.vault.createTitle}
            </h2>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-700 dark:text-[#888]">
                  {t.vault.vaultName}
                </label>
                <input
                  type="text"
                  value={newVaultName}
                  onChange={(e) => setNewVaultName(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-2.5 py-1.5 text-sm outline-none transition-colors focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 dark:border-[#404040] dark:bg-[#2b2b2b] dark:text-[#dcddde] dark:focus:border-[#555] dark:focus:ring-[#7f6df2]/20"
                  placeholder={t.vault.vaultNamePlaceholder}
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-700 dark:text-[#888]">
                  {t.vault.location}
                </label>
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1 truncate rounded-lg bg-neutral-100 px-2.5 py-1.5 text-xs text-neutral-600 dark:bg-[#2b2b2b] dark:text-[#888]">
                    {selectedPath || t.vault.notSelected}
                  </div>
                  <button
                    onClick={handleSelectLocation}
                    className="shrink-0 rounded-lg bg-neutral-100 px-2.5 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-200 dark:bg-[#333] dark:text-[#888] dark:hover:bg-[#404040]"
                  >
                    {t.common.browse}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs text-red-600 dark:bg-red-500/10 dark:text-red-400">
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleCancelCreate}
                  className="flex-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-[#404040] dark:text-[#888] dark:hover:bg-[#383838]"
                >
                  {t.common.cancel}
                </button>
                <button
                  onClick={handleCreateVault}
                  disabled={!selectedPath || !newVaultName.trim()}
                  className="flex-1 rounded-lg bg-[#7f6df2] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#6b5ce7] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t.common.create}
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Action buttons
          <div className="w-full max-w-xs">
            <div className="mb-4 text-center">
              <img src="/logo.png" alt="LoreNote" className="mx-auto mb-2 h-20 w-20" />
              <h2 className="mb-0.5 text-base font-semibold text-neutral-800 dark:text-[#dcddde]">
                {t.vault.welcome}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-[#888]">{t.vault.welcomeDesc}</p>
            </div>

            {/* Development version warning */}
            <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-500/30 dark:bg-amber-500/10">
              <TriangleAlert size={14} className="mt-0.5 shrink-0 text-amber-500 dark:text-amber-400" />
              <div>
                <div className="text-xs font-medium text-amber-700 dark:text-amber-400">
                  {t.vault.devWarning}
                </div>
                <div className="text-[11px] text-amber-600 dark:text-amber-500">
                  {t.vault.devWarningDesc}
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-2 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs text-red-600 dark:bg-red-500/10 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <button
                onClick={() => setIsCreating(true)}
                className="flex w-full items-center gap-2.5 rounded-lg border border-neutral-200 bg-white p-2.5 text-left transition-all hover:border-neutral-300 hover:shadow-sm dark:border-[#333] dark:bg-[#252525] dark:hover:border-[#404040]"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#7f6df2] text-white">
                  <Plus size={14} />
                </div>
                <div>
                  <div className="text-[13px] font-medium text-neutral-800 dark:text-[#dcddde]">{t.vault.createNew}</div>
                  <div className="text-[11px] text-neutral-500 dark:text-[#888]">
                    {t.vault.createNewDesc}
                  </div>
                </div>
              </button>

              <button
                onClick={handleBrowseVault}
                className="flex w-full items-center gap-2.5 rounded-lg border border-neutral-200 bg-white p-2.5 text-left transition-all hover:border-neutral-300 hover:shadow-sm dark:border-[#333] dark:bg-[#252525] dark:hover:border-[#404040]"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-neutral-100 text-neutral-600 dark:bg-[#333] dark:text-[#888]">
                  <FolderOpen size={14} />
                </div>
                <div>
                  <div className="text-[13px] font-medium text-neutral-800 dark:text-[#dcddde]">{t.vault.openExisting}</div>
                  <div className="text-[11px] text-neutral-500 dark:text-[#888]">
                    {t.vault.openExistingDesc}
                  </div>
                </div>
              </button>
            </div>

            {/* Bottom - language, settings and about */}
            <div className="mt-3 flex w-full items-center justify-between">
              {/* Language selection */}
              <div className="relative">
                <button
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-[#888] dark:hover:bg-[#383838] dark:hover:text-[#dcddde]"
                >
                  <Globe size={13} />
                  <span>{supportedLocales.find(l => l.code === locale)?.nativeName}</span>
                </button>
                {showLanguageMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowLanguageMenu(false)}
                    />
                    <div className="absolute bottom-full left-0 z-50 mb-1 w-28 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg dark:border-[#404040] dark:bg-[#2b2b2b]">
                      {supportedLocales.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setLocale(lang.code);
                            setShowLanguageMenu(false);
                          }}
                          className="flex w-full items-center justify-between px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100 dark:text-[#888] dark:hover:bg-[#383838]"
                        >
                          <span>{lang.nativeName}</span>
                          {locale === lang.code && (
                            <Check size={12} className="text-[#7f6df2]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1">
                {/* Settings */}
                <button
                  onClick={() => openSettings()}
                  className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:text-[#666] dark:hover:bg-[#383838] dark:hover:text-[#aaa]"
                  title={t.common.settings}
                >
                  <Settings size={15} />
                </button>

                {/* About */}
                <button
                  onClick={() => setShowAbout(true)}
                  className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:text-[#666] dark:hover:bg-[#383838] dark:hover:text-[#aaa]"
                  title={t.common.about}
                >
                  <Info size={15} />
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* About dialog */}
      {showAbout && (
        <>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setShowAbout(false)}
          >
            <div
              className="w-80 rounded-xl bg-white p-6 shadow-xl dark:bg-[#252525]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7f6df2] text-2xl font-bold text-white">
                  L
                </div>
                <h3 className="text-lg font-semibold text-neutral-800 dark:text-[#dcddde]">LoreNote</h3>
                <p className="text-sm text-neutral-500 dark:text-[#888]">{t.aboutDialog.version} {APP_VERSION}</p>
              </div>
              <p className="mb-4 text-center text-sm text-neutral-600 dark:text-[#888]">
                {t.aboutDialog.description}
              </p>
              <div className="text-center text-xs text-neutral-400 dark:text-[#666]">
                {t.aboutDialog.copyright}
              </div>
              <button
                onClick={() => setShowAbout(false)}
                className="mt-4 w-full rounded-lg bg-neutral-100 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200 dark:bg-[#333] dark:text-[#888] dark:hover:bg-[#404040]"
              >
                {t.common.close}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="w-96 rounded-xl bg-white p-6 shadow-xl dark:bg-[#252525]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-500 dark:bg-red-500/20">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-800 dark:text-[#dcddde]">
                  {t.vault.deleteConfirmTitle}
                </h3>
                <p className="text-sm text-neutral-500 dark:text-[#888]">{deleteConfirm.name}</p>
              </div>
            </div>

            <p className="mb-4 text-sm text-neutral-600 dark:text-[#888]">
              {t.vault.deleteConfirmDesc}
            </p>

            <div className="mb-4 rounded-lg bg-neutral-50 p-3 dark:bg-[#1e1e1e]">
              <p className="mb-1 text-xs text-neutral-500 dark:text-[#666]">{t.vault.location}</p>
              <p className="break-all text-xs text-neutral-700 dark:text-[#888]">{deleteConfirm.path}</p>
            </div>

            <label className="mb-4 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={deleteWithData}
                onChange={(e) => setDeleteWithData(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-red-500 focus:ring-red-500 dark:border-[#404040] dark:bg-[#2b2b2b]"
              />
              <div>
                <span className="text-sm font-medium text-neutral-700 dark:text-[#dcddde]">
                  {t.vault.deleteDataOption}
                </span>
                {deleteWithData && (
                  <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                    {t.vault.deleteDataWarning}
                  </p>
                )}
              </div>
            </label>

            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-[#404040] dark:text-[#888] dark:hover:bg-[#383838]"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleConfirmDelete}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
                  deleteWithData
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-[#7f6df2] hover:bg-[#6b5ce7]'
                }`}
              >
                {t.common.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
