import { createContext, useContext, useEffect, useCallback, type ReactNode } from 'react';
import type { Locale, Translations } from './types';
import { SUPPORTED_LOCALES } from './types';
import { zh } from './locales/zh';
import { en } from './locales/en';
import { useSettingsStore } from '@/stores';

/** 语言包映射 */
const translations: Record<Locale, Translations> = {
  zh,
  en,
};

/** 获取当前语言的翻译（用于非组件场景） */
export function getTranslations(): Translations {
  const locale = useSettingsStore.getState().appearance.locale;
  return translations[locale];
}

/** i18n Context 类型 */
interface I18nContextType {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
  supportedLocales: typeof SUPPORTED_LOCALES;
}

/** i18n Context */
const I18nContext = createContext<I18nContextType | null>(null);

/** i18n Provider Props */
interface I18nProviderProps {
  children: ReactNode;
}

/** i18n Provider 组件 */
export function I18nProvider({ children }: I18nProviderProps) {
  const settingsLocale = useSettingsStore((state) => state.appearance.locale);
  const settingsSetLocale = useSettingsStore((state) => state.setLocale);

  // 切换语言
  const setLocale = useCallback((newLocale: Locale) => {
    settingsSetLocale(newLocale);
    // 更新 HTML lang 属性
    document.documentElement.lang = newLocale;
  }, [settingsSetLocale]);

  // 初始化时设置 HTML lang 属性
  useEffect(() => {
    document.documentElement.lang = settingsLocale;
  }, [settingsLocale]);

  const value: I18nContextType = {
    locale: settingsLocale,
    t: translations[settingsLocale],
    setLocale,
    supportedLocales: SUPPORTED_LOCALES,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** 使用 i18n Hook */
export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

/** 获取翻译 Hook (简化版) */
export function useTranslation() {
  const { t, locale, setLocale } = useI18n();
  return { t, locale, setLocale };
}
