import { useMemo, useState, useCallback, useEffect } from 'react';
import { Star, Download, Check, ExternalLink, Code, Trash2, Copy, type LucideIcon } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useTranslation } from '@/i18n';
import {
  Button,
  ScrollArea,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Card,
  CardContent,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui';
import { componentRegistry } from '../registry';
import { useLocalComponentsStore } from '../store';
import type { ComponentInfo, ComponentSchema } from '../types';
import { useTabStore, COMPONENT_DETAIL_TAB_ID } from '@/stores';
import { renderSchema, DataEngine, type SchemaComponent } from '@/engine-v8';

interface ComponentDetailPageProps {
  componentId: string;
}

export function ComponentDetailPage({ componentId }: ComponentDetailPageProps) {
  const { t } = useTranslation();
  const { getComponentById: getLocalComponentById, deleteComponent, updateComponent } = useLocalComponentsStore();
  const { closeTab, findTabByPageId } = useTabStore();

  // 首先从本地组件中查找，然后从注册表中查找
  const component = useMemo(() => {
    const localComponent = getLocalComponentById(componentId);
    if (localComponent) return localComponent;

    // 从注册表获取组件并转换为 ComponentInfo 格式
    const registryComponent = componentRegistry.getById(componentId);
    if (!registryComponent) return undefined;

    return {
      id: registryComponent.id,
      type: registryComponent.type,
      name: registryComponent.name,
      description: registryComponent.description,
      icon: registryComponent.icon,
      category: registryComponent.category as ComponentInfo['category'],
      source: registryComponent.source,
      version: registryComponent.version,
      author: registryComponent.author,
      downloads: registryComponent.downloads,
      rating: registryComponent.rating,
      installed: registryComponent.installed,
      tags: registryComponent.tags,
      createdAt: registryComponent.createdAt,
      updatedAt: registryComponent.updatedAt,
      schema: registryComponent.schema as ComponentSchema,
    } satisfies ComponentInfo;
  }, [componentId, getLocalComponentById]);

  const isLocalComponent = component?.source === 'local';

  if (!component) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">{t.componentLibrary.noResults}</p>
      </div>
    );
  }

  // 动态获取图标
  const IconComponent = (Icons as unknown as Record<string, LucideIcon>)[component.icon] || Icons.Box;

  // 获取翻译文本
  const getTranslatedText = (key: string): string => {
    const keys = key.split('.');
    let value: unknown = t;
    for (const k of keys) {
      value = (value as Record<string, unknown>)?.[k];
    }
    return (value as string) || key;
  };

  // 格式化下载数
  const formatDownloads = (num: number): string => {
    if (num >= 10000) return `${(num / 1000).toFixed(1)}k`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const name = component.name.startsWith('componentLibrary.')
    ? getTranslatedText(component.name)
    : component.name;

  const description = component.description.startsWith('componentLibrary.')
    ? getTranslatedText(component.description)
    : component.description;

  // 处理安装
  const handleInstall = () => {
    console.log('Installing component:', componentId);
    // TODO: 实现安装逻辑
  };

  // 处理删除本地组件
  const handleDelete = async () => {
    const success = await deleteComponent(componentId);
    if (success) {
      // 关闭详情标签页
      const tab = findTabByPageId(COMPONENT_DETAIL_TAB_ID);
      if (tab) {
        closeTab(tab.id);
      }
    }
  };

  // 处理保存 Schema
  const handleSaveSchema = async (schema: ComponentSchema) => {
    await updateComponent(componentId, { schema });
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-8">
          {/* 组件头部信息 */}
          <div className="flex items-start gap-5">
            {/* 图标 */}
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 ring-1 ring-primary/10">
              <IconComponent size={32} className="text-primary" />
            </div>

            {/* 基本信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-semibold text-foreground">{name}</h1>
                {component.source === 'official' && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                    {t.componentLibrary.card.official}
                  </span>
                )}
                {component.source === 'local' && (
                  <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                    {t.componentLibrary.card.local}
                  </span>
                )}
                <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                  v{component.version}
                </span>
              </div>

              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{description}</p>

              {/* 元信息 */}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>{t.componentLibrary.card.by} <span className="text-foreground">{component.author}</span></span>
                {component.rating && (
                  <span className="flex items-center gap-1">
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    {component.rating.toFixed(1)}
                  </span>
                )}
                {component.downloads && (
                  <span className="flex items-center gap-1">
                    <Download size={12} />
                    {formatDownloads(component.downloads)} {t.componentLibrary.card.downloads}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 标签 */}
          {component.tags && component.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {component.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="mt-5 flex items-center gap-2">
            {component.source === 'community' && (
              component.installed ? (
                <Button variant="outline" size="sm" disabled className="gap-1.5">
                  <Check size={14} />
                  {t.componentLibrary.card.installed}
                </Button>
              ) : (
                <Button size="sm" onClick={handleInstall} className="gap-1.5">
                  <Download size={14} />
                  {t.componentLibrary.card.install}
                </Button>
              )
            )}
            {!isLocalComponent && (
              <Button variant="outline" size="sm" className="gap-1.5">
                <ExternalLink size={14} />
                {t.componentLibrary.detail.viewSource}
              </Button>
            )}
            {isLocalComponent && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive">
                    <Trash2 size={14} />
                    {t.componentLibrary.detail.deleteComponent}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t.componentLibrary.detail.deleteComponent}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t.componentLibrary.detail.deleteConfirm}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      {t.common.delete}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {/* 详细内容标签页 */}
          <Tabs defaultValue="preview" className="mt-8">
            <TabsList className="h-9">
              <TabsTrigger value="preview" className="text-xs">{t.componentLibrary.detail.preview}</TabsTrigger>
              {isLocalComponent && (
                <TabsTrigger value="schema" className="text-xs gap-1">
                  <Code size={12} />
                  Schema
                </TabsTrigger>
              )}
              <TabsTrigger value="usage" className="text-xs">{t.componentLibrary.detail.usage}</TabsTrigger>
              <TabsTrigger value="changelog" className="text-xs">{t.componentLibrary.detail.changelog}</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="mt-4">
              <ComponentPreview component={component} />
            </TabsContent>

            {isLocalComponent && (
              <TabsContent value="schema" className="mt-4">
                <SchemaEditor component={component} onSave={handleSaveSchema} />
              </TabsContent>
            )}

            <TabsContent value="usage" className="mt-4">
              <ComponentUsage component={component} />
            </TabsContent>

            <TabsContent value="changelog" className="mt-4">
              <ComponentChangelog component={component} />
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}

// 预览组件 - 使用 V8 引擎渲染
function ComponentPreview({ component }: { component: ComponentInfo }) {
  const { t } = useTranslation();
  const [, forceUpdate] = useState(0);

  const PREVIEW_PAGE_ID = `__preview_${component.id}__`;
  const PREVIEW_VAULT_PATH = '__preview_vault__';

  // 当 schema 变化时，更新 DataEngine 缓存
  useEffect(() => {
    if (component.schema) {
      const schema = component.schema as SchemaComponent;
      const schemaWithId = schema.id ? schema : { ...schema, id: PREVIEW_PAGE_ID };
      DataEngine.setPage(PREVIEW_PAGE_ID, PREVIEW_VAULT_PATH, {
        element: 'div',
        id: 'root',
        children: [schemaWithId],
      });
    }
  }, [component.schema, component.id, PREVIEW_PAGE_ID]);

  const handleUpdate = useCallback(() => {
    forceUpdate(n => n + 1);
  }, []);

  const handleSave = useCallback(() => {
    // 预览模式不保存
  }, []);

  const renderedComponent = useMemo(() => {
    if (!component.schema) {
      return null;
    }

    try {
      const schema = component.schema as SchemaComponent;
      const schemaWithId = schema.id ? schema : { ...schema, id: PREVIEW_PAGE_ID };
      return renderSchema(schemaWithId, PREVIEW_PAGE_ID, PREVIEW_VAULT_PATH, handleUpdate, handleSave);
    } catch (e) {
      console.error('[ComponentPreview] Render error:', e);
      return null;
    }
  }, [component.schema, PREVIEW_PAGE_ID, handleUpdate, handleSave]);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="min-h-[160px] rounded-lg border border-dashed border-border bg-muted/30 p-4">
          {renderedComponent ? (
            <div className="component-preview">
              {renderedComponent}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">{t.componentLibrary.detail.previewPlaceholder}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// 使用说明组件 - 显示 Schema 源码
function ComponentUsage({ component }: { component: ComponentInfo }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const schemaJson = useMemo(() => {
    if (!component.schema) return '{}';
    return JSON.stringify(component.schema, null, 2);
  }, [component.schema]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(schemaJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">{t.componentLibrary.detail.schemaSource}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 gap-1.5 text-xs"
            >
              {copied ? (
                <>
                  <Check size={12} />
                  {t.common.copied}
                </>
              ) : (
                <>
                  <Copy size={12} />
                  {t.common.copy}
                </>
              )}
            </Button>
          </div>
          <pre className="max-h-80 overflow-auto rounded-md bg-muted p-4 text-xs leading-relaxed">
            <code>{schemaJson}</code>
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h3 className="mb-2 text-sm font-medium text-foreground">{t.componentLibrary.detail.props}</h3>
          <div className="space-y-2 text-xs text-muted-foreground">
            {component.schema?.data && Object.keys(component.schema.data).length > 0 ? (
              <div className="rounded-md bg-muted p-3">
                <p className="mb-2 font-medium text-foreground">{t.componentLibrary.detail.dataFields}:</p>
                <ul className="list-inside list-disc space-y-1">
                  {Object.entries(component.schema.data).map(([key, value]) => (
                    <li key={key}>
                      <code className="text-primary">{key}</code>: {typeof value}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p>{t.componentLibrary.detail.noDataFields}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// 更新日志组件
function ComponentChangelog({ component }: { component: ComponentInfo }) {
  const { t } = useTranslation();

  // 模拟更新日志
  const changelog = [
    {
      version: component.version,
      date: component.updatedAt,
      changes: [t.componentLibrary.detail.initialRelease],
    },
  ];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {changelog.map((log) => (
            <div key={log.version}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">v{log.version}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(log.date).toLocaleDateString()}
                </span>
              </div>
              <ul className="mt-2 list-inside list-disc text-xs text-muted-foreground">
                {log.changes.map((change, idx) => (
                  <li key={idx}>{change}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Schema 编辑器组件
function SchemaEditor({
  component,
  onSave,
}: {
  component: ComponentInfo;
  onSave: (schema: ComponentSchema) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [schemaText, setSchemaText] = useState(() =>
    JSON.stringify(component.schema || {}, null, 2)
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    try {
      const parsed = JSON.parse(schemaText) as ComponentSchema;
      setError(null);
      setSaving(true);
      await onSave(parsed);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError(t.componentLibrary.detail.schemaInvalid);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">
            {t.componentLibrary.detail.schemaEditor}
          </h3>
          <div className="flex items-center gap-2">
            {saved && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400">
                {t.componentLibrary.detail.schemaSaved}
              </span>
            )}
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {t.componentLibrary.detail.saveSchema}
            </Button>
          </div>
        </div>
        <textarea
          value={schemaText}
          onChange={(e) => {
            setSchemaText(e.target.value);
            setError(null);
          }}
          className="h-80 w-full resize-none rounded-md border border-border bg-muted/30 p-3 font-mono text-xs leading-relaxed outline-none transition-colors focus:border-primary"
          spellCheck={false}
        />
        {error && (
          <p className="mt-2 text-xs text-destructive">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}
