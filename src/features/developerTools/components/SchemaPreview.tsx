import { useState, useMemo, useEffect, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { renderSchema, DataEngine, type SchemaComponent } from '@/engine-v8';

interface SchemaPreviewProps {
  schema: SchemaComponent | null;
}

// 开发者工具预览使用的虚拟 pageId 和 vaultPath
const PREVIEW_PAGE_ID = '__dev_preview__';
const PREVIEW_VAULT_PATH = '__dev_vault__';

/**
 * Schema 预览组件
 * 使用 V8 渲染引擎
 */
export function SchemaPreview({ schema }: SchemaPreviewProps) {
  const { t } = useTranslation();
  const [, forceUpdate] = useState(0);

  // 当 schema 变化时，更新 DataEngine 缓存
  const schemaKey = useMemo(() => JSON.stringify(schema), [schema]);

  useEffect(() => {
    if (schema) {
      // 确保 schema 有 id
      const schemaWithId = schema.id ? schema : { ...schema, id: PREVIEW_PAGE_ID };
      DataEngine.setPage(PREVIEW_PAGE_ID, PREVIEW_VAULT_PATH, {
        element: 'div',
        id: 'root',
        children: [schemaWithId],
      });
    }
  }, [schemaKey, schema]);

  // 更新回调
  const handleUpdate = useCallback(() => {
    forceUpdate(n => n + 1);
  }, []);

  // 保存回调（预览模式不需要保存）
  const handleSave = useCallback(() => {
    // 预览模式不保存
  }, []);

  // 渲染预览
  const preview = useMemo(() => {
    if (!schema) return null;
    try {
      const schemaWithId = schema.id ? schema : { ...schema, id: PREVIEW_PAGE_ID };
      return renderSchema(schemaWithId, PREVIEW_PAGE_ID, PREVIEW_VAULT_PATH, handleUpdate, handleSave);
    } catch (e) {
      console.error('[SchemaPreview] Render error:', e);
      return (
        <div className="flex items-center gap-2 text-destructive text-xs">
          <AlertCircle size={14} />
          {t.developerTools.editor.previewError}: {(e as Error).message}
        </div>
      );
    }
  }, [schemaKey, schema, handleUpdate, handleSave, t.developerTools.editor.previewError]);

  return <>{preview}</>;
}
