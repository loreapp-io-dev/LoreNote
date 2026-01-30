import { useState, useRef, useCallback } from 'react';
import { Wrench, FileCode, LayoutTemplate, Bug, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useDeveloperToolsStore } from '../store';
import { Button, ScrollArea } from '@/components/ui';
import { SchemaDocumentation } from './SchemaDocumentation';
import { SchemaEditor } from './SchemaEditor';
import { TemplateLibrary } from './TemplateLibrary';
import { DebugConsole } from './DebugConsole';
import { cn } from '@/lib/utils';

type RightPanelTab = 'editor' | 'templates' | 'debug';

// Documentation panel width range
const MIN_DOC_WIDTH = 240;
const MAX_DOC_WIDTH = 600;
const DEFAULT_DOC_WIDTH = 320;

/** Developer tools standalone page - left-right split layout */
export function DeveloperToolsPage() {
  const { t } = useTranslation();
  const { setEditorContent } = useDeveloperToolsStore();
  const [rightTab, setRightTab] = useState<RightPanelTab>('editor');
  const [docCollapsed, setDocCollapsed] = useState(false);
  const [docWidth, setDocWidth] = useState(DEFAULT_DOC_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const rightTabs: { id: RightPanelTab; icon: typeof FileCode; label: string }[] = [
    { id: 'editor', icon: FileCode, label: t.developerTools.tabs.editor },
    { id: 'templates', icon: LayoutTemplate, label: t.developerTools.tabs.templates },
    { id: 'debug', icon: Bug, label: t.developerTools.tabs.debug },
  ];

  // Handle loading template from template library to editor
  const handleLoadTemplate = (schemaJson: string) => {
    setEditorContent(schemaJson);
    setRightTab('editor');
  };

  // Handle drag resize width
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const startX = e.clientX;
    const startWidth = docWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX;
      const newWidth = Math.min(MAX_DOC_WIDTH, Math.max(MIN_DOC_WIDTH, startWidth + delta));
      setDocWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [docWidth]);

  return (
    <div ref={containerRef} className="flex h-full flex-col bg-background">
      {/* Top title bar */}
      <div className="flex-shrink-0 flex items-center gap-3 border-b border-border px-4 py-3 bg-card/50">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Wrench size={16} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-foreground">
            {t.developerTools.title}
          </h1>
        </div>
      </div>

      {/* Main content area - left-right split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Documentation area */}
        <div
          className={cn(
            "flex-shrink-0 flex flex-col border-r border-border bg-muted/30 transition-[width] duration-200 overflow-hidden",
            docCollapsed ? "w-0" : "",
            isResizing && "transition-none"
          )}
          style={{ width: docCollapsed ? 0 : docWidth }}
        >
          {!docCollapsed && (
            <>
              {/* Documentation title */}
              <div className="flex-shrink-0 flex items-center justify-between border-b border-border px-4 py-2 bg-background/50">
                <span className="text-xs font-medium text-muted-foreground">
                  {t.developerTools.tabs.docs}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setDocCollapsed(true)}
                  >
                    <ChevronLeft size={14} />
                  </Button>
                </div>
              </div>
·
              {/* Documentation content */}
              <ScrollArea className="flex-1 min-h-0">
                <div className="p-4">
                  <SchemaDocumentation />
                </div>
              </ScrollArea>
            </>
          )}
        </div>

        {/* Drag resize handle */}
        {!docCollapsed && (
          <div
            className={cn(
              "flex-shrink-0 w-1 cursor-col-resize bg-transparent hover:bg-primary/20 transition-colors flex items-center justify-center group",
              isResizing && "bg-primary/30"
            )}
            onMouseDown={handleMouseDown}
          >
            <GripVertical size={12} className="text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}

        {/* Expand button when collapsed */}
        {docCollapsed && (
          <div className="flex-shrink-0 flex flex-col items-center border-r border-border bg-muted/30 py-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setDocCollapsed(false)}
              title={t.developerTools.tabs.docs}
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        )}

        {/* Right: Development area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Right tab navigation */}
          <div className="flex-shrink-0 flex items-center gap-1 border-b border-border bg-muted/30 px-2">
            {rightTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = rightTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setRightTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors rounded-t-md",
                    isActive
                      ? "bg-background text-foreground border-t border-l border-r border-border -mb-px"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Right content area */}
          <div className="flex-1 overflow-hidden bg-background">
            {/* Editor */}
            {rightTab === 'editor' && (
              <SchemaEditor />
            )}

            {/* Template library */}
            {rightTab === 'templates' && (
              <ScrollArea className="h-full">
                <div className="p-4">
                  <TemplateLibrary onLoadToEditor={handleLoadTemplate} />
                </div>
              </ScrollArea>
            )}

            {/* Debug console */}
            {rightTab === 'debug' && (
              <DebugConsole />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
