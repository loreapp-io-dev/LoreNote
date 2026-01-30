import { useMemo } from 'react';
import {
  Clock,
  FileText,
  Calendar,
  Briefcase,
  BookOpen,
  File,
  ArrowRight,
  Play,
  BookOpenCheck,
  Check,
  GraduationCap,
  LayoutGrid,
} from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useTabStore, useSettingsStore } from '@/stores';
import { Card, CardContent, ScrollableRow } from '@/components/ui';
import { renderItemIcon } from '@/features/files/utils/iconUtils';
import type { IconType } from '@/types';

function getGreeting(t: ReturnType<typeof useTranslation>['t']) {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return t.home.greeting.morning;
  if (hour >= 12 && hour < 18) return t.home.greeting.afternoon;
  if (hour >= 18 && hour < 22) return t.home.greeting.evening;
  return t.home.greeting.night;
}

export function HomePage() {
  const { t } = useTranslation();
  const { recentVisits, openTab } = useTabStore();
  const gettingStartedRead = useSettingsStore((state) => state.local.gettingStartedRead);
  const markGettingStartedRead = useSettingsStore((state) => state.markGettingStartedRead);

  const greeting = useMemo(() => getGreeting(t), [t]);

  const handleRecentClick = (pageId: string, title: string, icon?: string, iconType?: string) => {
    openTab(pageId, title, icon, iconType as 'lucide' | 'emoji' | undefined);
  };

  const handleGettingStartedClick = (id: string) => {
    markGettingStartedRead(id);
  };

  const gettingStartedItems = [
    {
      id: 'create-note',
      title: t.home.gettingStartedItems.createNote,
      desc: t.home.gettingStartedItems.createNoteDesc,
      readTime: 3,
      thumbnail: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      id: 'organize-files',
      title: t.home.gettingStartedItems.organizeFiles,
      desc: t.home.gettingStartedItems.organizeFilesDesc,
      readTime: 5,
      thumbnail: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
    {
      id: 'use-templates',
      title: t.home.gettingStartedItems.useTemplates,
      desc: t.home.gettingStartedItems.useTemplatesDesc,
      readTime: 4,
      thumbnail: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
    {
      id: 'keyboard-shortcuts',
      title: t.home.gettingStartedItems.keyboardShortcuts,
      desc: t.home.gettingStartedItems.keyboardShortcutsDesc,
      readTime: 2,
      thumbnail: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    },
  ];

  const templateItems = [
    {
      icon: FileText,
      title: t.home.templateItems.meetingNotes,
      desc: t.home.templateItems.meetingNotesDesc,
    },
    {
      icon: Calendar,
      title: t.home.templateItems.weeklyPlan,
      desc: t.home.templateItems.weeklyPlanDesc,
    },
    {
      icon: Briefcase,
      title: t.home.templateItems.projectDoc,
      desc: t.home.templateItems.projectDocDesc,
    },
    {
      icon: BookOpen,
      title: t.home.templateItems.diary,
      desc: t.home.templateItems.diaryDesc,
    },
  ];

  return (
    <div className="flex h-full flex-col overflow-auto px-8 py-12 md:px-16 lg:px-24">
      {/* Greeting Section - Centered and smaller */}
      <section className="mb-10 text-center">
        <h1 className="text-xl font-medium text-foreground md:text-2xl">
          {greeting}
        </h1>
      </section>

      {/* Recent Visits */}
      <section className="mb-8">
        <div className="mb-3 flex items-center gap-1.5">
          <Clock size={14} className="text-muted-foreground" />
          <h2 className="text-sm font-medium text-foreground">
            {t.home.recentVisits}
          </h2>
        </div>
        {recentVisits.length > 0 ? (
          <ScrollableRow>
            {recentVisits.slice(0, 12).map((visit) => (
              <button
                key={visit.pageId}
                onClick={() =>
                  handleRecentClick(visit.pageId, visit.title, visit.icon, visit.iconType)
                }
                className="group relative flex w-44 shrink-0 flex-col items-center gap-2.5 overflow-hidden rounded-xl border border-border bg-card p-3 text-center transition-all hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 dark:bg-card/50 dark:hover:bg-card/80 dark:hover:border-primary/40"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 dark:from-primary/25 dark:to-primary/10">
                  {visit.icon ? (
                    renderItemIcon(visit.icon, visit.iconType as IconType, 20)
                  ) : (
                    <File size={20} className="text-primary/70 dark:text-primary/90" />
                  )}
                </div>
                <span className="w-full truncate text-xs font-medium text-foreground">
                  {visit.title}
                </span>
                <ArrowRight
                  size={14}
                  className="absolute right-2 top-2 text-muted-foreground opacity-0 transition-all group-hover:opacity-100"
                />
              </button>
            ))}
          </ScrollableRow>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex items-center justify-center py-6">
              <p className="text-xs text-muted-foreground">{t.home.noRecentVisits}</p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Getting Started */}
      <section className="mb-8">
        <div className="mb-3 flex items-center gap-1.5">
          <GraduationCap size={14} className="text-muted-foreground" />
          <h2 className="text-sm font-medium text-foreground">
            {t.home.gettingStarted}
          </h2>
        </div>
        <ScrollableRow>
          {gettingStartedItems.map((item) => {
            const isRead = gettingStartedRead.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => handleGettingStartedClick(item.id)}
                className="group w-64 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 dark:bg-card/50 dark:hover:bg-card/80 dark:hover:border-primary/40"
              >
                {/* Video Preview Area */}
                <div
                  className="relative flex h-32 items-center justify-center"
                  style={{ background: item.thumbnail }}
                >
                  {/* Play Button */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/25 backdrop-blur-sm transition-transform group-hover:scale-110 dark:bg-white/30">
                    <Play size={20} className="ml-0.5 text-white" fill="white" />
                  </div>
                </div>
                {/* Content */}
                <div className="p-3">
                  {/* Title with checkmark on the right */}
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="flex-1 truncate text-xs font-medium text-foreground">
                      {item.title}
                    </h3>
                    {isRead && (
                      <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green-500 dark:bg-green-600">
                        <Check size={10} className="text-white" />
                      </div>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                    {item.desc}
                  </p>
                  {/* Footer */}
                  <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <BookOpenCheck size={12} />
                    <span>{t.home.readTime.replace('{count}', String(item.readTime))}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </ScrollableRow>
      </section>

      {/* Templates */}
      <section>
        <div className="mb-3 flex items-center gap-1.5">
          <LayoutGrid size={14} className="text-muted-foreground" />
          <h2 className="text-sm font-medium text-foreground">
            {t.home.templates}
          </h2>
        </div>
        <ScrollableRow>
          {templateItems.map((item, index) => (
            <div
              key={index}
              className="group relative w-44 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 dark:bg-card/50 dark:hover:bg-card/80 dark:hover:border-primary/40"
            >
              {/* Icon area with gradient background */}
              <div className="flex h-28 items-center justify-center bg-gradient-to-br from-violet-500/20 to-violet-500/5 dark:from-violet-500/30 dark:to-violet-500/10">
                <item.icon size={36} className="text-violet-500 transition-transform group-hover:scale-110 dark:text-violet-400" />
              </div>
              {/* Hover overlay with title */}
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                <div className="w-full p-3">
                  <h3 className="text-xs font-medium text-white">
                    {item.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-[11px] text-white/80">
                    {item.desc}
                  </p>
                </div>
              </div>
              {/* Default title below */}
              <div className="p-2.5">
                <h3 className="truncate text-xs font-medium text-foreground">
                  {item.title}
                </h3>
              </div>
            </div>
          ))}
        </ScrollableRow>
      </section>
    </div>
  );
}
