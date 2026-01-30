/**
 * PageLoader - 页面加载器组件
 *
 * 功能：监听活动标签页变化，自动加载对应的页面内容到编辑器
 * 这是一个逻辑组件，不渲染任何 UI
 */
import { useEffect, useRef } from 'react';
import { useActivePageId } from '@/stores';
import { usePage } from '@/features/vault';

export function PageLoader() {
  const activePageId = useActivePageId();
  const { openPage } = usePage();
  const loadingRef = useRef(false);
  const lastLoadedPageIdRef = useRef<string | null>(null);

  useEffect(() => {
    // 如果没有活动页面，不执行任何操作
    if (!activePageId) {
      return;
    }

    // 如果已经加载过这个页面，跳过
    if (lastLoadedPageIdRef.current === activePageId) {
      return;
    }

    // 防止重复加载
    if (loadingRef.current) {
      return;
    }

    // 标记为正在加载
    loadingRef.current = true;

    // 加载页面内容
    openPage(activePageId).finally(() => {
      // 加载完成后重置标志
      loadingRef.current = false;
      lastLoadedPageIdRef.current = activePageId;
    });
  }, [activePageId, openPage]);

  return null; // 逻辑组件，不渲染任何内容
}
