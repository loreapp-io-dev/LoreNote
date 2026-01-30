import { Suspense } from 'react';
import { useTabStore } from '@/stores';
import { TabEditorV8 } from './TabEditor.v8';
import { EditorSkeleton } from './EditorSkeleton';

/**
 * EditorContainer - 多编辑器容器
 *
 * 负责：
 * 1. 只渲染当前活动的标签页（性能优化）
 * 2. 使用 Suspense 处理异步加载
 */
export function EditorContainer() {
  const tabs = useTabStore((state) => state.tabs);
  const activeTabId = useTabStore((state) => state.activeTabId);

  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  if (!activeTab) {
    return null;
  }

  return (
    <div className="editor-container relative h-full">
      <div className="editor-wrapper h-full">
        <Suspense fallback={<EditorSkeleton />}>
          <TabEditorV8 key={activeTab.id} tabId={activeTab.id} pageId={activeTab.pageId} />
        </Suspense>
      </div>
    </div>
  );
}
