import { useEffect, useCallback } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { AppLayout } from '@/components/layout';
import { EditorContainer } from '@/features/editor/components/EditorContainer';
import { VaultSelector } from '@/features/vault';
import { SettingsPanel } from '@/features/settings';
import { GlobalSlashCommandManager } from '@/components/GlobalSlashCommandManager';
import { useVaultStore, useSettingsStore, useTabStore } from '@/stores';
import { initTabStore } from '@/stores/tabStore';
import { initUIStore } from '@/stores/uiStore';
import { startAnalytics } from '@/services/analyticsService';
import './App.css';

function App() {
  const { currentVault } = useVaultStore();
  const { initSettings, _initialized } = useSettingsStore();

  // 初始化设置和状态存储
  useEffect(() => {
    const init = async () => {
      // 初始化 UI 和标签页状态（从文件加载）
      await Promise.all([initUIStore(), initTabStore()]);

      // 初始化应用设置
      if (!_initialized) {
        initSettings();
      }

      // 启动分析服务（发送心跳）
      startAnalytics();
    };
    init();
  }, [_initialized, initSettings]);

  // 仓库切换时清理所有标签页
  useEffect(() => {
    if (!currentVault) return;

    const { closeAllTabs, openHomeTab } = useTabStore.getState();

    // 清理所有标签页
    closeAllTabs();

    // 打开主页标签页
    openHomeTab();
  }, [currentVault]);

  // 仓库打开回调 - 调整窗口大小
  const handleVaultOpen = useCallback(async () => {
    const window = getCurrentWindow();
    // 设置更大的窗口尺寸
    await window.setSize(new (await import('@tauri-apps/api/dpi')).LogicalSize(1200, 800));
    // 窗口居中
    await window.center();
  }, []);

  // 如果没有打开仓库，显示仓库选择界面
  if (!currentVault) {
    return (
      <>
        <VaultSelector onVaultOpen={handleVaultOpen} />
        <SettingsPanel />
      </>
    );
  }

  return (
    <>
      <AppLayout>
        <EditorContainer />
      </AppLayout>
      <SettingsPanel />
      <GlobalSlashCommandManager />
    </>
  );
}

export default App;
