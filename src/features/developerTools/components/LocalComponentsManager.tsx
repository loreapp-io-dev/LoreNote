import { useState, useEffect } from 'react';
import { Plus, Trash2, Code, FolderOpen } from 'lucide-react';
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useLocalComponentsStore } from '@/features/components/store';
import { useDeveloperToolsStore } from '../store';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui';
import type { ComponentInfo, ComponentCategory } from '@/features/components/types';
import { componentCategories } from '@/features/components/types';

export function LocalComponentsManager() {
  const { t } = useTranslation();
  const { localComponents, loading, loadComponents, deleteComponent } = useLocalComponentsStore();
  const { loadFromTemplate, setActiveTab } = useDeveloperToolsStore();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // 加载本地组件
  useEffect(() => {
    loadComponents();
  }, [loadComponents]);

  // 处理编辑组件 Schema
  const handleEditSchema = (component: ComponentInfo) => {
    if (component.schema) {
      loadFromTemplate(JSON.stringify(component.schema, null, 2));
      setActiveTab('editor');
    }
  };

  return (
    <div className="space-y-4">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen size={16} className="text-primary" />
          <h3 className="text-sm font-medium text-foreground">
            {t.componentLibrary.local.title}
          </h3>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            {localComponents.length}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1 text-xs h-7"
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus size={12} />
          {t.componentLibrary.local.create}
        </Button>
      </div>

      {/* 组件列表 */}
      {loading ? (
        <div className="flex h-20 items-center justify-center text-xs text-muted-foreground">
          {t.common.loading}
        </div>
      ) : localComponents.length === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 text-center">
          <FolderOpen size={24} className="text-muted-foreground/50" />
          <p className="text-xs text-muted-foreground">
            {t.componentLibrary.local.empty}
          </p>
          <p className="text-[10px] text-muted-foreground/70">
            {t.componentLibrary.local.emptyHint}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {localComponents.map((component) => (
            <LocalComponentCard
              key={component.id}
              component={component}
              onEditSchema={() => handleEditSchema(component)}
              onDelete={() => setDeleteConfirmId(component.id)}
            />
          ))}
        </div>
      )}

      {/* 创建对话框 */}
      <CreateLocalComponentDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      {/* 删除确认对话框 */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.componentLibrary.detail.deleteComponent}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.componentLibrary.detail.deleteConfirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteConfirmId) {
                  deleteComponent(deleteConfirmId);
                  setDeleteConfirmId(null);
                }
              }}
            >
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// 本地组件卡片
function LocalComponentCard({
  component,
  onEditSchema,
  onDelete,
}: {
  component: ComponentInfo;
  onEditSchema: () => void;
  onDelete: () => void;
}) {
  const IconComponent = (Icons as unknown as Record<string, LucideIcon>)[component.icon || 'Box'] || Icons.Box;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent/20">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-muted">
        <IconComponent size={18} className="text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-foreground truncate">
            {component.name}
          </h4>
          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
            v{component.version}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground truncate">
          {component.description}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onEditSchema}
          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Edit Schema"
        >
          <Code size={14} />
        </button>
        <button
          onClick={onDelete}
          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// 创建本地组件对话框（内联版本）
function CreateLocalComponentDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const { addComponent } = useLocalComponentsStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ComponentCategory>('basic');
  const [icon, setIcon] = useState('Box');
  const [tags, setTags] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // 获取翻译
  const getTranslatedText = (key: string): string => {
    const keys = key.split('.');
    let value: unknown = t;
    for (const k of keys) {
      value = (value as Record<string, unknown>)?.[k];
    }
    return (value as string) || key;
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;

    setSubmitLoading(true);
    try {
      const tagsArray = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

      const result = await addComponent(name.trim(), description.trim(), category, undefined, {
        icon: icon || 'Box',
        tags: tagsArray,
        author: 'Local',
      });

      if (result) {
        // 重置表单
        setName('');
        setDescription('');
        setCategory('basic');
        setIcon('Box');
        setTags('');
        onOpenChange(false);
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setCategory('basic');
    setIcon('Box');
    setTags('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t.componentLibrary.local.createTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 名称 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t.componentLibrary.local.name}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.componentLibrary.local.namePlaceholder}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            />
          </div>

          {/* 描述 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t.componentLibrary.local.description}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.componentLibrary.local.descriptionPlaceholder}
              rows={3}
              className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            />
          </div>

          {/* 分类 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t.componentLibrary.local.category}
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

          {/* 图标 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t.componentLibrary.local.icon}
            </label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder={t.componentLibrary.local.iconPlaceholder}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            />
          </div>

          {/* 标签 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t.componentLibrary.local.tags}
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder={t.componentLibrary.local.tagsPlaceholder}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t.common.cancel}
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || submitLoading}>
            {t.common.create}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
