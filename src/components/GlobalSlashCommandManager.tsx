/** 全局斜杠命令管理器 */

import { useCallback, useState } from 'react';
import { useSlashCommandStore } from '@/stores/slashCommandStore';
import { SlashCommandMenuV8 } from '@/features/editor/slash-commands/SlashCommandMenu.v8';
import { SlashCommandTrigger } from './SlashCommandTrigger';
import { DataEngine } from '@/engine-v8';
import { savePage } from '@/services/pageService';
import { componentRegistry } from '@/features/components/registry';
import type { RegisteredComponent } from '@/features/components/registry/types';
import { useVaultStore } from '@/stores';

export function GlobalSlashCommandManager() {
  const { isOpen, position, editorWidth, pageId, vaultPath, close } = useSlashCommandStore();
  const pages = useVaultStore((state) => state.pages);
  const [filter, setFilter] = useState('');
  const [isSlashMode, setIsSlashMode] = useState(false);

  // 处理输入框输入
  const handleInput = useCallback((value: string, slashMode: boolean) => {
    setFilter(value);
    setIsSlashMode(slashMode);
  }, []);

  // 处理组件选择
  const handleComponentSelect = useCallback(
    (component: RegisteredComponent) => {
      if (!pageId || !vaultPath) return;

      const newComponent = componentRegistry.createInstance(component.id);
      if (!newComponent) return;

      const schema = DataEngine.readPage(pageId, vaultPath);

      if (schema) {
        const updatedSchema = {
          ...schema,
          children: [...(schema.children || []), newComponent],
        };
        DataEngine.setPage(pageId, vaultPath, updatedSchema);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        savePage(vaultPath, pageId, updatedSchema as any, { pages }).catch(console.error);

        // 触发页面更新
        window.dispatchEvent(new CustomEvent('page-updated', { detail: { pageId } }));
      }

      close();
      setFilter('');
      setIsSlashMode(false);
    },
    [pageId, vaultPath, pages, close]
  );

  // 处理关闭
  const handleClose = useCallback(() => {
    close();
    setFilter('');
    setIsSlashMode(false);
  }, [close]);

  // 计算菜单位置（在输入框下方）
  const menuPosition = {
    x: position.x,
    y: position.y + 50, // 输入框高度 + 间距
  };

  return (
    <>
      {/* 浮动输入框 */}
      <SlashCommandTrigger
        isOpen={isOpen}
        position={position}
        editorWidth={editorWidth}
        onInput={handleInput}
        onClose={handleClose}
      />

      {/* 命令菜单 - 只在斜杠模式下显示 */}
      {isSlashMode && (
        <SlashCommandMenuV8
          isOpen={isOpen}
          position={menuPosition}
          onSelect={handleComponentSelect}
          onClose={handleClose}
          filter={filter}
        />
      )}
    </>
  );
}
