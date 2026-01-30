/** 内联斜杠输入框 - 在块之间显示 */

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Plus, GripVertical } from 'lucide-react';
import { DataEngine, createEmptyBlockSchema } from '@/engine-v8';
import { savePage } from '@/services/pageService';
import { useTranslation } from '@/i18n';
import { SlashMenu } from '@/features/components/slash-menu/SlashMenu';
import { componentRegistry } from '@/features/components/registry';
import type { RegisteredComponent } from '@/features/components/registry/types';
import { WikiLinkPopup } from './WikiLinkPopup';
import { useVaultStore } from '@/stores';
import { getWikiLinkQuery, completeWikiLink } from '@/services/wikiLinkService';

interface InlineSlashInputProps {
  pageId: string;
  vaultPath: string;
  insertIndex: number;
  onClose: () => void;
  onInserted: () => void;
  onOpenNextInput?: (index: number) => void;
  onSelectBlock?: (index: number | null) => void;
  selectedBlockIndex?: number | null;
}

export function InlineSlashInput({
  pageId,
  vaultPath,
  insertIndex,
  onClose,
  onInserted,
  onOpenNextInput,
  onSelectBlock,
  selectedBlockIndex,
}: InlineSlashInputProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const pages = useVaultStore((state) => state.pages);

  const isSlashMode = value.startsWith('/');
  const filter = isSlashMode ? value.slice(1) : '';

  // Wiki 链接模式检测
  const wikiLinkQuery = getWikiLinkQuery(value);
  const isWikiLinkMode = wikiLinkQuery !== null;

  // 获取可用组件列表（用于键盘导航）
  const availableComponents = useMemo(() => {
    return componentRegistry.search(filter, {
      installedOnly: true,
      enabledOnly: true,
    });
  }, [filter]);

  // 自动聚焦
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // 重置选中索引
  useEffect(() => {
    setSelectedIndex(0);
  }, [filter]);

  // 处理组件选择
  const handleComponentSelect = useCallback(
    (component: RegisteredComponent) => {
      const newComponent = componentRegistry.createInstance(component.id);
      if (!newComponent) {
        console.error('[InlineSlashInput] Failed to create component instance');
        return;
      }

      console.log('[InlineSlashInput] component created', {
        componentId: component.id,
        element: newComponent.element,
        props: JSON.stringify(newComponent.props),
        data: JSON.stringify(newComponent.data),
      });

      const schema = DataEngine.readPage(pageId, vaultPath);

      if (schema) {
        const children = [...(schema.children || [])];
        children.splice(insertIndex, 0, newComponent);
        const updatedSchema = { ...schema, children };

        DataEngine.setPage(pageId, vaultPath, updatedSchema);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        savePage(vaultPath, pageId, updatedSchema as any, { pages }).catch(console.error);
        window.dispatchEvent(new CustomEvent('page-updated', { detail: { pageId } }));
        // 通知编辑器聚焦到新创建的块
        window.dispatchEvent(new CustomEvent('focus-block', { detail: { blockId: newComponent.id, blockIndex: insertIndex } }));
      }

      onClose();
      onInserted();
    },
    [pageId, vaultPath, insertIndex, onClose, onInserted]
  );

  // 处理 Wiki 链接页面选择
  const handleWikiLinkSelect = useCallback(
    (page: { id: string; title: string }) => {
      const newValue = completeWikiLink(value, page.title);
      setValue(newValue);
      inputRef.current?.focus();
    },
    [value]
  );

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // 阻止 Tab 键默认行为（防止退出窗口）
    if (e.key === 'Tab') {
      e.preventDefault();
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onSelectBlock?.(null);
      onClose();
    } else if (e.key === 'ArrowUp' && !isSlashMode && !isWikiLinkMode) {
      // 上键 - 如果有内容先创建文本块，然后聚焦上方文本块
      e.preventDefault();
      const schema = DataEngine.readPage(pageId, vaultPath);
      if (!schema?.children) return;

      // 如果有内容，先创建文本组件（复用回车逻辑）
      if (value.trim()) {
        const newComponent = componentRegistry.createInstanceByType('text');
        if (newComponent) {
          newComponent.data = { ...newComponent.data, content: value };
          const children = [...(schema.children || [])];
          children.splice(insertIndex, 0, newComponent);
          const updatedSchema = { ...schema, children };
          DataEngine.setPage(pageId, vaultPath, updatedSchema);
          savePage(vaultPath, pageId, updatedSchema as any, { pages }).catch(console.error);
          window.dispatchEvent(new CustomEvent('page-updated', { detail: { pageId } }));
        }
      }

      // 聚焦上方文本块
      for (let i = insertIndex - 1; i >= 0; i--) {
        const child = schema.children[i];
        if (typeof child !== 'string' && child?.props?.contentEditable === true) {
          onSelectBlock?.(null);
          onClose();
          window.dispatchEvent(new CustomEvent('focus-block', { detail: { blockIndex: i } }));
          return;
        }
      }
      onSelectBlock?.(null);
      onClose();
    } else if (e.key === 'ArrowDown' && !isSlashMode && !isWikiLinkMode) {
      // 下键 - 如果有内容先创建文本块，然后聚焦下方文本块
      e.preventDefault();
      let schema = DataEngine.readPage(pageId, vaultPath);
      if (!schema?.children) return;

      // 如果有内容，先创建文本组件（复用回车逻辑）
      let offset = 0;
      if (value.trim()) {
        const newComponent = componentRegistry.createInstanceByType('text');
        if (newComponent) {
          newComponent.data = { ...newComponent.data, content: value };
          const children = [...(schema.children || [])];
          children.splice(insertIndex, 0, newComponent);
          const updatedSchema = { ...schema, children };
          DataEngine.setPage(pageId, vaultPath, updatedSchema);
          savePage(vaultPath, pageId, updatedSchema as any, { pages }).catch(console.error);
          window.dispatchEvent(new CustomEvent('page-updated', { detail: { pageId } }));
          schema = updatedSchema; // 使用更新后的 schema
          offset = 1;
        }
      }

      // 聚焦下方文本块
      const children = schema.children || [];
      for (let i = insertIndex + offset; i < children.length; i++) {
        const child = children[i];
        if (typeof child !== 'string' && child?.props?.contentEditable === true) {
          onSelectBlock?.(null);
          onClose();
          window.dispatchEvent(new CustomEvent('focus-block', { detail: { blockIndex: i } }));
          return;
        }
      }
      onSelectBlock?.(null);
      onClose();
    } else if (e.key === 'Backspace' && value === '' && insertIndex > 0) {
      // 退格键 - 无内容时处理上方块
      e.preventDefault();
      const schema = DataEngine.readPage(pageId, vaultPath);
      if (schema?.children) {
        const prevBlockIndex = insertIndex - 1;
        const prevBlock = schema.children[prevBlockIndex];
        if (typeof prevBlock === 'string') return;

        // 检查上一个块是否为空块
        const isEmptyBlock = prevBlock.props?.['data-block-type'] === 'empty';
        // 检查是否为可编辑文本块（有 contentEditable）
        const isTextBlock = prevBlock.props?.contentEditable === true;

        if (isEmptyBlock) {
          // 空块：直接删除
          const children = schema.children.filter((_, i) => i !== prevBlockIndex);
          const updatedSchema = { ...schema, children };
          DataEngine.setPage(pageId, vaultPath, updatedSchema);
          savePage(vaultPath, pageId, updatedSchema as any, { pages }).catch(console.error);
          window.dispatchEvent(new CustomEvent('page-updated', { detail: { pageId } }));
          onSelectBlock?.(null);
          if (onOpenNextInput) {
            onOpenNextInput(prevBlockIndex);
          }
        } else if (isTextBlock) {
          // 文本块：聚焦到它
          onSelectBlock?.(null);
          onClose();
          window.dispatchEvent(new CustomEvent('focus-block', { detail: { blockIndex: prevBlockIndex } }));
        } else if (selectedBlockIndex === prevBlockIndex) {
          // 已选中的块：删除它
          const children = schema.children.filter((_, i) => i !== prevBlockIndex);
          const updatedSchema = { ...schema, children };
          DataEngine.setPage(pageId, vaultPath, updatedSchema);
          savePage(vaultPath, pageId, updatedSchema as any, { pages }).catch(console.error);
          window.dispatchEvent(new CustomEvent('page-updated', { detail: { pageId } }));
          onSelectBlock?.(null);
          if (onOpenNextInput) {
            onOpenNextInput(prevBlockIndex);
          }
        } else {
          // 其他块：选中它
          onSelectBlock?.(prevBlockIndex);
        }
      }
    } else if (e.key === 'Enter' && !isSlashMode && !isWikiLinkMode) {
      // 非斜杠模式下回车
      e.preventDefault();
      let newComponent;
      console.log('[InlineSlashInput] Enter pressed', {
        value,
        insertIndex,
        hasOnOpenNextInput: !!onOpenNextInput,
      });

      if (value.trim()) {
        // 有内容：创建文本块
        newComponent = componentRegistry.createInstanceByType('text');
        if (newComponent) {
          newComponent.data = { ...newComponent.data, content: value };
        }
      } else {
        // 无内容：创建空块
        newComponent = createEmptyBlockSchema();
      }

      if (newComponent) {
        const schema = DataEngine.readPage(pageId, vaultPath);
        if (schema) {
          const children = [...(schema.children || [])];
          children.splice(insertIndex, 0, newComponent);
          const updatedSchema = { ...schema, children };
          DataEngine.setPage(pageId, vaultPath, updatedSchema);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          savePage(vaultPath, pageId, updatedSchema as any, { pages }).catch(console.error);
          window.dispatchEvent(new CustomEvent('page-updated', { detail: { pageId } }));
        }
        onClose();
        onInserted();
        // 回车后自动打开新的输入框
        if (onOpenNextInput) {
          console.log('[InlineSlashInput] Calling onOpenNextInput with', insertIndex + 1);
          onOpenNextInput(insertIndex + 1);
        }
      }
    } else if (isSlashMode) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, availableComponents.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (availableComponents[selectedIndex]) {
          handleComponentSelect(availableComponents[selectedIndex]);
        }
      }
    }
  };

  return (
    <div ref={containerRef} className="group py-1">
      <div className="flex items-center gap-1">
        {/* 左侧操作按钮：添加在前，拖动在后 */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => {
              // 添加空块
              const newComponent = createEmptyBlockSchema();
              if (newComponent) {
                const schema = DataEngine.readPage(pageId, vaultPath);
                if (schema) {
                  const children = [...(schema.children || [])];
                  children.splice(insertIndex, 0, newComponent);
                  const updatedSchema = { ...schema, children };
                  DataEngine.setPage(pageId, vaultPath, updatedSchema);
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  savePage(vaultPath, pageId, updatedSchema as any, { pages }).catch(console.error);
                  window.dispatchEvent(new CustomEvent('page-updated', { detail: { pageId } }));
                }
                onClose();
                onInserted();
              }
            }}
            title={t.editor?.addBlock || '添加块'}
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-grab"
            title={t.editor?.dragToMove || '拖动移动'}
          >
            <GripVertical className="w-4 h-4" />
          </button>
        </div>

        {/* 输入框 */}
        <div className="flex-1">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full outline-none bg-transparent text-foreground placeholder:text-muted-foreground/60"
            placeholder={
              isSlashMode
                ? t.editor?.filterPlaceholder || '筛选...'
                : t.editor?.inputPlaceholder || '输入文本，按"空格"启动AI，按"/"启用指令'
            }
          />
        </div>
      </div>

      {/* 内联命令菜单 - 与输入框左对齐 */}
      {isSlashMode && (
        <div className="mt-1">
          <SlashMenu
            searchQuery={filter}
            selectedIndex={selectedIndex}
            onSelectedIndexChange={setSelectedIndex}
            onSelect={handleComponentSelect}
            onClose={onClose}
          />
        </div>
      )}

      {/* Wiki 链接弹窗 */}
      {isWikiLinkMode && (
        <div className="mt-1">
          <WikiLinkPopup
            searchQuery={wikiLinkQuery}
            pages={pages.filter(p => p.id !== pageId)}
            onSelect={handleWikiLinkSelect}
            onClose={() => setValue(value.replace(/\[\[[^\]]*$/, ''))}
          />
        </div>
      )}
    </div>
  );
}
