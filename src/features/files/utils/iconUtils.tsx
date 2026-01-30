import { File, type LucideIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { IconType } from '@/types';

// 常用 Lucide 图标映射
const lucideIconMap: Record<string, LucideIcon> = {
  // 文件类型
  File: LucideIcons.File,
  FileText: LucideIcons.FileText,
  FileCode: LucideIcons.FileCode,
  FileImage: LucideIcons.FileImage,
  FileVideo: LucideIcons.FileVideo,
  FileAudio: LucideIcons.FileAudio,
  FilePlus: LucideIcons.FilePlus,
  FileCheck: LucideIcons.FileCheck,
  // 文件夹
  Folder: LucideIcons.Folder,
  FolderOpen: LucideIcons.FolderOpen,
  FolderPlus: LucideIcons.FolderPlus,
  FolderCheck: LucideIcons.FolderCheck,
  // 常用
  Star: LucideIcons.Star,
  Heart: LucideIcons.Heart,
  Bookmark: LucideIcons.Bookmark,
  Tag: LucideIcons.Tag,
  Flag: LucideIcons.Flag,
  Pin: LucideIcons.Pin,
  // 状态
  Circle: LucideIcons.Circle,
  CheckCircle: LucideIcons.CheckCircle,
  AlertCircle: LucideIcons.AlertCircle,
  XCircle: LucideIcons.XCircle,
  Clock: LucideIcons.Clock,
  Calendar: LucideIcons.Calendar,
  // 工具
  Settings: LucideIcons.Settings,
  Wrench: LucideIcons.Wrench,
  Hammer: LucideIcons.Hammer,
  Zap: LucideIcons.Zap,
  Lightbulb: LucideIcons.Lightbulb,
  // 交流
  MessageCircle: LucideIcons.MessageCircle,
  Mail: LucideIcons.Mail,
  Phone: LucideIcons.Phone,
  Users: LucideIcons.Users,
  User: LucideIcons.User,
  // 其他
  Home: LucideIcons.Home,
  Book: LucideIcons.Book,
  Library: LucideIcons.Library,
  Music: LucideIcons.Music,
  Film: LucideIcons.Film,
  Camera: LucideIcons.Camera,
  Image: LucideIcons.Image,
  Globe: LucideIcons.Globe,
  Map: LucideIcons.Map,
  Compass: LucideIcons.Compass,
  Sun: LucideIcons.Sun,
  Moon: LucideIcons.Moon,
  Cloud: LucideIcons.Cloud,
  Rocket: LucideIcons.Rocket,
  Trophy: LucideIcons.Trophy,
  Target: LucideIcons.Target,
  Gift: LucideIcons.Gift,
  Coffee: LucideIcons.Coffee,
  Smile: LucideIcons.Smile,
  Sparkles: LucideIcons.Sparkles,
};

// 常用 Emoji 列表
export const commonEmojis = [
  '📄', '📁', '📂', '📝', '📋', '📌', '📎', '✏️',
  '⭐', '❤️', '💡', '🎯', '🚀', '💻', '📱', '🔧',
  '🏠', '📚', '🎵', '🎬', '📷', '🌍', '🗺️', '☀️',
  '🌙', '☁️', '🎁', '☕', '😊', '✨', '🔥', '💪',
  '📊', '📈', '💰', '🎨', '🎭', '🎮', '⚡', '🔒',
];

// 图标分类
export const iconCategories = {
  files: ['File', 'FileText', 'FileCode', 'FileImage', 'FileVideo', 'FileAudio'],
  folders: ['Folder', 'FolderOpen', 'FolderPlus', 'FolderCheck'],
  common: ['Star', 'Heart', 'Bookmark', 'Tag', 'Flag', 'Pin'],
  status: ['Circle', 'CheckCircle', 'AlertCircle', 'XCircle', 'Clock', 'Calendar'],
  tools: ['Settings', 'Wrench', 'Hammer', 'Zap', 'Lightbulb'],
  communication: ['MessageCircle', 'Mail', 'Phone', 'Users', 'User'],
  other: ['Home', 'Book', 'Library', 'Music', 'Film', 'Camera', 'Image', 'Globe', 'Map', 'Compass', 'Sun', 'Moon', 'Cloud', 'Rocket', 'Trophy', 'Target', 'Gift', 'Coffee', 'Smile', 'Sparkles'],
};

/**
 * 渲染图标
 */
export function renderItemIcon(
  icon: string | undefined,
  iconType: IconType | undefined,
  size = 16,
  className = ''
): React.ReactNode {
  if (!icon) {
    return <File size={size} className={className || 'text-neutral-400 dark:text-[#888]'} />;
  }

  if (iconType === 'emoji') {
    return <span className="text-base leading-none">{icon}</span>;
  }

  // Lucide 图标
  const IconComponent = lucideIconMap[icon];
  if (IconComponent) {
    return <IconComponent size={size} className={className || 'text-neutral-500 dark:text-[#888]'} />;
  }

  // 如果找不到图标，返回默认
  return <File size={size} className={className || 'text-neutral-400 dark:text-[#888]'} />;
}

/**
 * 获取可用的 Lucide 图标列表
 */
export function getLucideIconNames(): string[] {
  return Object.keys(lucideIconMap);
}

/**
 * 获取 Lucide 图标组件
 */
export function getLucideIcon(name: string): LucideIcon | undefined {
  return lucideIconMap[name];
}
