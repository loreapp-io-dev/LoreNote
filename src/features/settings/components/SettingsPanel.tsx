import { X, Palette, FileEdit, FolderCog, Wrench, Check, Sun, Moon, Monitor } from 'lucide-react';
import { useSettingsStore } from '@/stores';
import { useTranslation } from '@/i18n';
import { useI18n } from '@/i18n';
import type { Theme } from '@/types';

type SettingsCategory = 'appearance' | 'editor' | 'files' | 'advanced';

const categoryIcons: Record<SettingsCategory, typeof Palette> = {
  appearance: Palette,
  editor: FileEdit,
  files: FolderCog,
  advanced: Wrench,
};

export function SettingsPanel() {
  const { t } = useTranslation();
  const { locale, setLocale, supportedLocales } = useI18n();
  const {
    isSettingsOpen,
    activeCategory,
    closeSettings,
    setActiveCategory,
    appearance,
    editor,
    files,
    advanced,
    setTheme,
    updateEditor,
    updateFiles,
    updateAdvanced,
    resetSettings,
  } = useSettingsStore();

  if (!isSettingsOpen) return null;

  const categories: { id: SettingsCategory; label: string }[] = [
    { id: 'appearance', label: t.settings.categories.appearance },
    { id: 'editor', label: t.settings.categories.editor },
    { id: 'files', label: t.settings.categories.files },
    { id: 'advanced', label: t.settings.categories.advanced },
  ];

  const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: t.settings.appearance.themeLight, icon: Sun },
    { value: 'dark', label: t.settings.appearance.themeDark, icon: Moon },
    { value: 'system', label: t.settings.appearance.themeSystem, icon: Monitor },
  ];

  const handleThemeChange = (theme: Theme) => {
    setTheme(theme);
  };

  const handleLocaleChange = (newLocale: string) => {
    setLocale(newLocale as 'zh' | 'en');
  };

  const handleReset = () => {
    if (window.confirm(t.settings.advanced.resetConfirm)) {
      resetSettings();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="flex h-[600px] w-[800px] overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-[#1e1e1e]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left category navigation */}
        <div className="flex w-52 flex-col border-r border-neutral-200 bg-neutral-50 dark:border-[#333] dark:bg-[#252525]">
          <div className="flex h-14 items-center px-5">
            <h2 className="text-lg font-semibold text-neutral-800 dark:text-[#dcddde]">
              {t.settings.title}
            </h2>
          </div>
          <nav className="flex-1 px-3 py-2">
            {categories.map((cat) => {
              const Icon = categoryIcons[cat.id];
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`
                    flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors
                    ${
                      isActive
                        ? 'bg-neutral-200 text-neutral-900 dark:bg-[#404040] dark:text-[#dcddde]'
                        : 'text-neutral-600 hover:bg-neutral-100 dark:text-[#888] dark:hover:bg-[#383838]'
                    }
                  `}
                >
                  <Icon size={18} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right settings content */}
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <div className="flex h-14 items-center justify-between border-b border-neutral-200 px-6 dark:border-[#333]">
            <h3 className="text-base font-medium text-neutral-800 dark:text-[#dcddde]">
              {categories.find((c) => c.id === activeCategory)?.label}
            </h3>
            <button
              onClick={closeSettings}
              className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 dark:text-[#888] dark:hover:bg-[#383838]"
            >
              <X size={20} />
            </button>
          </div>

          {/* Settings content area */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Appearance settings */}
            {activeCategory === 'appearance' && (
              <div className="space-y-6">
                {/* Theme */}
                <SettingItem
                  label={t.settings.appearance.theme}
                >
                  <div className="flex gap-2">
                    {themeOptions.map((option) => {
                      const Icon = option.icon;
                      const isSelected = appearance.theme === option.value;
                      return (
                        <button
                          key={option.value}
                          onClick={() => handleThemeChange(option.value)}
                          className={`
                            flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors
                            ${
                              isSelected
                                ? 'border-[#7f6df2] bg-[#7f6df2] text-white'
                                : 'border-neutral-200 text-neutral-700 hover:border-neutral-300 dark:border-[#404040] dark:text-[#888] dark:hover:border-[#555]'
                            }
                          `}
                        >
                          <Icon size={16} />
                          <span>{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </SettingItem>

                {/* Language */}
                <SettingItem label={t.settings.appearance.language}>
                  <div className="flex gap-2">
                    {supportedLocales.map((lang) => {
                      const isSelected = locale === lang.code;
                      return (
                        <button
                          key={lang.code}
                          onClick={() => handleLocaleChange(lang.code)}
                          className={`
                            flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors
                            ${
                              isSelected
                                ? 'border-[#7f6df2] bg-[#7f6df2] text-white'
                                : 'border-neutral-200 text-neutral-700 hover:border-neutral-300 dark:border-[#404040] dark:text-[#888] dark:hover:border-[#555]'
                            }
                          `}
                        >
                          <span>{lang.nativeName}</span>
                          {isSelected && <Check size={14} />}
                        </button>
                      );
                    })}
                  </div>
                </SettingItem>
              </div>
            )}

            {/* Editor settings */}
            {activeCategory === 'editor' && (
              <div className="space-y-6">
                <SettingItem
                  label={t.settings.editor.autoSave}
                  description={t.settings.editor.autoSaveDesc}
                >
                  <input
                    type="number"
                    value={editor.autoSaveDelay / 1000}
                    onChange={(e) =>
                      updateEditor({ autoSaveDelay: Number(e.target.value) * 1000 })
                    }
                    min={1}
                    max={60}
                    className="w-20 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm dark:border-[#404040] dark:bg-[#2b2b2b] dark:text-[#dcddde]"
                  />
                </SettingItem>

                <SettingToggle
                  label={t.settings.editor.wordWrap}
                  checked={editor.wordWrap}
                  onChange={(checked) => updateEditor({ wordWrap: checked })}
                />

                <SettingToggle
                  label={t.settings.editor.spellCheck}
                  checked={editor.spellCheck}
                  onChange={(checked) => updateEditor({ spellCheck: checked })}
                />
              </div>
            )}

            {/* Files settings */}
            {activeCategory === 'files' && (
              <div className="space-y-6">
                {/* Folder limits section */}
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-neutral-800 dark:text-[#dcddde]">
                      {t.settings.files.folderLimits}
                    </div>
                    <div className="mt-1 text-xs text-neutral-500 dark:text-[#888]">
                      {t.settings.files.folderLimitsDesc}
                    </div>
                  </div>

                  {/* Enable folder limits toggle */}
                  <SettingToggle
                    label={t.settings.files.enableFolderLimits}
                    checked={files.enableFolderLimits}
                    onChange={(checked) => updateFiles({ enableFolderLimits: checked })}
                  />

                  {/* Conditional limit settings */}
                  {files.enableFolderLimits && (
                    <div className="space-y-4 border-l-2 border-neutral-200 pl-4 dark:border-[#404040]">
                      {/* Max nesting depth */}
                      <SettingItem
                        label={t.settings.files.maxFolderDepth}
                        description={t.settings.files.maxFolderDepthDesc}
                      >
                        <input
                          type="number"
                          value={files.maxFolderDepth}
                          onChange={(e) =>
                            updateFiles({
                              maxFolderDepth: Math.max(1, Math.min(10, Number(e.target.value))),
                            })
                          }
                          min={1}
                          max={10}
                          className="w-20 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm dark:border-[#404040] dark:bg-[#2b2b2b] dark:text-[#dcddde]"
                        />
                      </SettingItem>

                      {/* Max notes per folder */}
                      <SettingItem
                        label={t.settings.files.maxNotesPerFolder}
                        description={t.settings.files.maxNotesPerFolderDesc}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={files.maxNotesPerFolder}
                            onChange={(e) =>
                              updateFiles({
                                maxNotesPerFolder: Math.max(0, Number(e.target.value)),
                              })
                            }
                            min={0}
                            className="w-20 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm dark:border-[#404040] dark:bg-[#2b2b2b] dark:text-[#dcddde]"
                          />
                          {files.maxNotesPerFolder === 0 && (
                            <span className="text-xs text-neutral-500 dark:text-[#888]">
                              ({t.settings.files.unlimited})
                            </span>
                          )}
                        </div>
                      </SettingItem>

                      {/* Max subfolders per folder */}
                      <SettingItem
                        label={t.settings.files.maxSubfoldersPerFolder}
                        description={t.settings.files.maxSubfoldersPerFolderDesc}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={files.maxSubfoldersPerFolder}
                            onChange={(e) =>
                              updateFiles({
                                maxSubfoldersPerFolder: Math.max(0, Number(e.target.value)),
                              })
                            }
                            min={0}
                            className="w-20 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm dark:border-[#404040] dark:bg-[#2b2b2b] dark:text-[#dcddde]"
                          />
                          {files.maxSubfoldersPerFolder === 0 && (
                            <span className="text-xs text-neutral-500 dark:text-[#888]">
                              ({t.settings.files.unlimited})
                            </span>
                          )}
                        </div>
                      </SettingItem>

                      {/* Behavior when limit exceeded */}
                      <SettingItem
                        label={t.settings.files.folderLimitBehavior}
                        description={t.settings.files.folderLimitBehaviorDesc}
                      >
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateFiles({ folderLimitBehavior: 'warn' })}
                            className={`
                              rounded-lg border px-4 py-2 text-sm transition-colors
                              ${
                                files.folderLimitBehavior === 'warn'
                                  ? 'border-[#7f6df2] bg-[#7f6df2] text-white'
                                  : 'border-neutral-200 text-neutral-700 hover:border-neutral-300 dark:border-[#404040] dark:text-[#888] dark:hover:border-[#555]'
                              }
                            `}
                          >
                            {t.settings.files.behaviorWarn}
                          </button>
                          <button
                            onClick={() => updateFiles({ folderLimitBehavior: 'block' })}
                            className={`
                              rounded-lg border px-4 py-2 text-sm transition-colors
                              ${
                                files.folderLimitBehavior === 'block'
                                  ? 'border-[#7f6df2] bg-[#7f6df2] text-white'
                                  : 'border-neutral-200 text-neutral-700 hover:border-neutral-300 dark:border-[#404040] dark:text-[#888] dark:hover:border-[#555]'
                              }
                            `}
                          >
                            {t.settings.files.behaviorBlock}
                          </button>
                        </div>
                      </SettingItem>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Advanced settings */}
            {activeCategory === 'advanced' && (
              <div className="space-y-6">
                <SettingToggle
                  label={t.settings.advanced.developerMode}
                  description={t.settings.advanced.developerModeDesc}
                  checked={advanced.developerMode}
                  onChange={(checked) => updateAdvanced({ developerMode: checked })}
                />

                <SettingToggle
                  label={t.settings.advanced.hardwareAcceleration}
                  checked={advanced.hardwareAcceleration}
                  onChange={(checked) => updateAdvanced({ hardwareAcceleration: checked })}
                />

                <SettingToggle
                  label={t.settings.advanced.debugLogging}
                  checked={advanced.debugLogging}
                  onChange={(checked) => updateAdvanced({ debugLogging: checked })}
                />

                <div className="border-t border-neutral-200 pt-6 dark:border-[#404040]">
                  <SettingItem
                    label={t.settings.advanced.resetSettings}
                    description={t.settings.advanced.resetSettingsDesc}
                  >
                    <button
                      onClick={handleReset}
                      className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                    >
                      {t.settings.advanced.resetSettings}
                    </button>
                  </SettingItem>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Setting item component
interface SettingItemProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

function SettingItem({ label, description, children }: SettingItemProps) {
  return (
    <div className="flex items-start justify-between gap-8">
      <div className="flex-1">
        <div className="text-sm font-medium text-neutral-800 dark:text-[#dcddde]">
          {label}
        </div>
        {description && (
          <div className="mt-1 text-xs text-neutral-500 dark:text-[#888]">
            {description}
          </div>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// Toggle component
interface SettingToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function SettingToggle({ label, description, checked, onChange }: SettingToggleProps) {
  return (
    <div className="flex items-start justify-between gap-8">
      <div className="flex-1">
        <div className="text-sm font-medium text-neutral-800 dark:text-[#dcddde]">
          {label}
        </div>
        {description && (
          <div className="mt-1 text-xs text-neutral-500 dark:text-[#888]">
            {description}
          </div>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`
          relative h-6 w-11 shrink-0 rounded-full transition-colors
          ${checked ? 'bg-[#7f6df2]' : 'bg-neutral-200 dark:bg-[#404040]'}
        `}
      >
        <div
          className={`
            absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform
            ${checked ? 'left-[22px]' : 'left-0.5'}
          `}
        />
      </button>
    </div>
  );
}
