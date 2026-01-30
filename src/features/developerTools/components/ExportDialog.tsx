import { useState } from 'react';
import { useTranslation } from '@/i18n';
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { useLocalComponentsStore } from '@/features/components/store';
import { componentCategories } from '@/features/components/types';
import type { ComponentCategory, ComponentSchema } from '@/features/components/types';
import type { SchemaComponent } from '@/engine-v8';
import type { ExportedComponentFile } from '../types';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schema: SchemaComponent | null;
}

/** 转换 SchemaComponent 为 ComponentSchema */
function toComponentSchema(schema: SchemaComponent): ComponentSchema {
  return schema as unknown as ComponentSchema;
}

export function ExportDialog({ open, onOpenChange, schema }: ExportDialogProps) {
  const { t } = useTranslation();
  const { addComponent } = useLocalComponentsStore();

  // 表单状态
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ComponentCategory>('basic');
  const [icon, setIcon] = useState('Box');
  const [version, setVersion] = useState('1.0.0');
  const [author, setAuthor] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);

  // 获取翻译文本
  const getTranslatedText = (key: string): string => {
    const keys = key.split('.');
    let value: unknown = t;
    for (const k of keys) {
      value = (value as Record<string, unknown>)?.[k];
    }
    return (value as string) || key;
  };

  // 重置表单
  const resetForm = () => {
    setName('');
    setDescription('');
    setCategory('basic');
    setIcon('Box');
    setVersion('1.0.0');
    setAuthor('');
    setTags('');
  };

  // 处理关闭
  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  // 添加到本地组件库
  const handleAddToLocal = async () => {
    if (!schema || !name.trim()) return;

    setLoading(true);
    try {
      const tagsArray = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

      await addComponent(name.trim(), description.trim(), category, toComponentSchema(schema), {
        icon,
        tags: tagsArray,
        author: author.trim() || 'Local',
      });

      handleClose();
    } finally {
      setLoading(false);
    }
  };

  // 导出为 JSON 文件
  const handleExportJson = async () => {
    if (!schema || !name.trim()) return;

    setLoading(true);
    try {
      const tagsArray = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

      const exportData: ExportedComponentFile = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        component: {
          info: {
            name: name.trim(),
            description: description.trim(),
            category,
            type: 'custom',
            icon,
            version,
            author: author.trim() || 'Developer',
            source: 'local',
            tags: tagsArray,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          schema: toComponentSchema(schema),
        },
      };

      // 选择保存路径
      const filePath = await save({
        defaultPath: `${name.trim()}.json`,
        filters: [
          {
            name: 'JSON',
            extensions: ['json'],
          },
        ],
      });

      if (filePath) {
        await writeTextFile(filePath, JSON.stringify(exportData, null, 2));
        handleClose();
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t.developerTools.export.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 组件信息 */}
          <div className="text-sm font-medium text-foreground">
            {t.developerTools.export.componentInfo}
          </div>

          {/* 名称 */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              {t.developerTools.export.name}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.developerTools.export.namePlaceholder}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            />
          </div>

          {/* 描述 */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              {t.developerTools.export.description}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.developerTools.export.descriptionPlaceholder}
              rows={2}
              className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            />
          </div>

          {/* 分类和版本 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                {t.developerTools.export.category}
              </label>
              <Select value={category} onValueChange={(v) => setCategory(v as ComponentCategory)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {componentCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {getTranslatedText(cat.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                {t.developerTools.export.version}
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>
          </div>

          {/* 图标和作者 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                {t.developerTools.export.icon}
              </label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder={t.developerTools.export.iconPlaceholder}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                {t.developerTools.export.author}
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder={t.developerTools.export.authorPlaceholder}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
              />
            </div>
          </div>

          {/* 标签 */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              {t.developerTools.export.tags}
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder={t.developerTools.export.tagsPlaceholder}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            className="w-full"
            onClick={handleAddToLocal}
            disabled={!name.trim() || loading}
          >
            {t.developerTools.export.addToLocal}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleExportJson}
            disabled={!name.trim() || loading}
          >
            <span>{t.developerTools.export.exportJson}</span>
            <span className="ml-1 text-xs text-muted-foreground">
              ({t.developerTools.export.exportJsonDesc})
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
