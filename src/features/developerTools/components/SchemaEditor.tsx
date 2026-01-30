import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Download, AlertCircle, Code, Eye, Copy, Check, RotateCcw } from 'lucide-react';
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useDeveloperToolsStore } from '../store';
import { componentTemplates } from '../data/templates';
import { Button, ScrollArea } from '@/components/ui';
import { ExportDialog } from './ExportDialog';
import { SchemaPreview } from './SchemaPreview';
import { cn } from '@/lib/utils';
import type { SchemaComponent } from '@/engine-v8';

export function SchemaEditor() {
  const { t } = useTranslation();
  const { editorContent, setEditorContent } = useDeveloperToolsStore();
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const templateMenuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭模板菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (templateMenuRef.current && !templateMenuRef.current.contains(event.target as Node)) {
        setShowTemplateMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 解析 Schema 并检查错误
  const { schema, error } = useMemo(() => {
    try {
      const parsed = JSON.parse(editorContent) as SchemaComponent;
      return { schema: parsed, error: null };
    } catch (e) {
      return { schema: null, error: (e as Error).message };
    }
  }, [editorContent]);

  // 处理添加到本地
  const handleAddToLocal = () => {
    if (schema) {
      setShowExportDialog(true);
    }
  };

  // 处理选择模板
  const handleSelectTemplate = (schemaJson: string) => {
    setEditorContent(schemaJson);
    setShowTemplateMenu(false);
  };

  // 复制 Schema
  const handleCopy = async () => {
    await navigator.clipboard.writeText(editorContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 重置编辑器
  const handleReset = () => {
    setEditorContent('{\n  "element": "div",\n  "children": ["Hello, LoreNote!"]\n}');
  };

  // 格式化 JSON
  const handleFormat = () => {
    try {
      const parsed = JSON.parse(editorContent);
      setEditorContent(JSON.stringify(parsed, null, 2));
    } catch {
      // 忽略格式化错误
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* 工具栏 */}
      <div className="flex-shrink-0 flex items-center gap-2 border-b border-border bg-muted/30 px-3 py-2">
        {/* 从模板选择 */}
        <div className="relative" ref={templateMenuRef}>
          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-xs h-7"
            onClick={() => setShowTemplateMenu(!showTemplateMenu)}
          >
            <ChevronDown size={12} className={cn("transition-transform", showTemplateMenu && "rotate-180")} />
            {t.developerTools.editor.fromTemplate}
          </Button>

          {/* 模板下拉菜单 */}
          {showTemplateMenu && (
            <div className="absolute left-0 top-full mt-1 z-50 w-64 rounded-lg border border-border bg-popover shadow-lg">
              <ScrollArea className="h-[320px]">
                <div className="p-2 space-y-1 pb-3">
                  {componentTemplates.map((template) => {
                    const IconComponent = (Icons as unknown as Record<string, LucideIcon>)[template.icon] || Icons.Box;
                    return (
                      <button
                        key={template.id}
                        onClick={() => handleSelectTemplate(JSON.stringify(template.schema, null, 2))}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-accent transition-colors"
                      >
                        <IconComponent size={14} className="text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-foreground truncate">{template.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{template.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* 快捷操作 */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={handleFormat}
          title="Format JSON"
        >
          <Code size={14} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={handleCopy}
          title="Copy"
        >
          {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={handleReset}
          title="Reset"
        >
          <RotateCcw size={14} />
        </Button>

        <div className="flex-1" />

        {/* 导出操作 */}
        <Button
          variant="outline"
          size="sm"
          className="gap-1 text-xs h-7"
          onClick={handleAddToLocal}
          disabled={!schema}
        >
          <Plus size={12} />
          {t.developerTools.editor.addToLocal}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1 text-xs h-7"
          onClick={() => setShowExportDialog(true)}
          disabled={!schema}
        >
          <Download size={12} />
          {t.developerTools.editor.export}
        </Button>
      </div>

      {/* 编辑器主体 - 左右布局 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：Schema 编辑器 */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-border">
          {/* 编辑器标题 */}
          <div className="flex-shrink-0 flex items-center justify-between border-b border-border bg-muted/50 px-3 py-1.5">
            <div className="flex items-center gap-2">
              <Code size={12} className="text-muted-foreground" />
              <span className="text-[11px] font-medium text-muted-foreground">Schema JSON</span>
            </div>
            {error && (
              <span className="text-[10px] text-destructive flex items-center gap-1">
                <AlertCircle size={10} />
                Invalid
              </span>
            )}
            {schema && !error && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check size={10} />
                Valid
              </span>
            )}
          </div>

          {/* 编辑器区域 */}
          <div className="flex-1 min-h-0 relative">
            <textarea
              value={editorContent}
              onChange={(e) => setEditorContent(e.target.value)}
              placeholder={t.developerTools.editor.schemaPlaceholder}
              className="absolute inset-0 w-full h-full resize-none bg-background p-3 font-mono text-xs leading-relaxed outline-none placeholder:text-muted-foreground"
              spellCheck={false}
            />
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="flex-shrink-0 flex items-center gap-2 border-t border-border bg-destructive/10 px-3 py-1.5 text-[11px] text-destructive">
              <AlertCircle size={12} />
              <span className="truncate">{error}</span>
            </div>
          )}
        </div>

        {/* 右侧：预览区域 */}
        <div className="flex-1 flex flex-col min-w-0 bg-muted/20">
          {/* 预览标题 */}
          <div className="flex-shrink-0 flex items-center gap-2 border-b border-border bg-muted/50 px-3 py-1.5">
            <Eye size={12} className="text-muted-foreground" />
            <span className="text-[11px] font-medium text-muted-foreground">
              {t.developerTools.editor.preview}
            </span>
          </div>

          {/* 预览内容 */}
          <ScrollArea className="flex-1">
            <div className="p-4">
              {schema ? (
                <div className="rounded-lg border border-dashed border-border bg-background p-4 min-h-[120px]">
                  <SchemaPreview schema={schema} />
                </div>
              ) : (
                <div className="flex h-[120px] items-center justify-center rounded-lg border border-dashed border-border bg-background">
                  <div className="text-center">
                    <Code size={20} className="mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-[11px] text-muted-foreground">
                      {t.developerTools.editor.invalidJson}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* 导出对话框 */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        schema={schema}
      />
    </div>
  );
}
