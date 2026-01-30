/** Right panel - displays backlinks */

import { BacklinksPanel } from './BacklinksPanel';

interface RightPanelProps {
  pageId: string;
  vaultPath: string;
}

export function RightPanel({ pageId, vaultPath }: RightPanelProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <BacklinksPanel key={pageId} pageId={pageId} vaultPath={vaultPath} variant="sidebar" />
      </div>
    </div>
  );
}
