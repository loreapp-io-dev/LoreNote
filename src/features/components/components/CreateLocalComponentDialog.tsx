import { useState } from 'react';
import { useTranslation } from '@/i18n';
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
import { useLocalComponentsStore } from '../store';
import type { ComponentCategory } from '../types';
import { componentCategories } from '../types';

interface CreateLocalComponentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateLocalComponentDialog({
  open,
  onOpenChange,
}: CreateLocalComponentDialogProps) {
  const { t } = useTranslation();
  const { addComponent } = useLocalComponentsStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ComponentCategory>('basic');
  const [icon, setIcon] = useState('Box');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);

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

    setLoading(true);
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
      setLoading(false);
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
          <Button onClick={handleSubmit} disabled={!name.trim() || loading}>
            {t.common.create}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
