/** Graph data building utilities - based on bidirectional link system */

import { fs } from '@/services/fs';
import { traverseComponents, type SchemaComponent } from '@/engine-v8';
import type { PageReference } from '@/types';
import type { GraphData, GraphNode, GraphEdge } from './types';

/** Edge info: includes type */
interface EdgeInfo {
  target: string;
  type: 'link' | 'text';
}

/**
 * Build graph data - scan all pages to find bidirectional links ([[]] and plain text mentions)
 */
export async function buildGraphData(
  pages: PageReference[],
  vaultPath: string,
  currentPageId?: string
): Promise<GraphData> {
  // Store edges: source -> target mapping (includes type)
  const edgeMap = new Map<string, Map<string, EdgeInfo>>();
  // Store link count for each page
  const linkCountMap = new Map<string, number>();

  // Traverse all pages to find link relationships
  for (const sourcePage of pages) {
    try {
      const pagePath = `${vaultPath}/${sourcePage.id}.json`;
      const pageContent = await fs.readJson<{ page?: { content?: SchemaComponent } }>(pagePath);

      if (pageContent?.page?.content) {
        // Traverse component tree to find all text content
        traverseComponents(pageContent.page.content, (comp) => {
          if (comp.data) {
            const data = comp.data as { content?: string };
            if (data.content && typeof data.content === 'string') {
              // Check if mentions other pages
              for (const targetPage of pages) {
                // Skip self
                if (targetPage.id === sourcePage.id) continue;

                // Check link type
                const linkType = getLinkType(data.content, targetPage.title);
                if (linkType) {
                  // Add edge
                  if (!edgeMap.has(sourcePage.id)) {
                    edgeMap.set(sourcePage.id, new Map());
                  }
                  const targetMap = edgeMap.get(sourcePage.id)!;

                  // If exists, prefer 'link' type
                  const existing = targetMap.get(targetPage.id);
                  if (!existing || (existing.type === 'text' && linkType === 'link')) {
                    targetMap.set(targetPage.id, { target: targetPage.id, type: linkType });
                  }

                  // Increment target page link count
                  if (!existing) {
                    linkCountMap.set(
                      targetPage.id,
                      (linkCountMap.get(targetPage.id) || 0) + 1
                    );
                  }
                }
              }
            }
          }
        });
      }
    } catch (error) {
      console.warn(`[GraphUtils] Failed to process page ${sourcePage.id}:`, error);
    }
  }

  // Collect all page IDs with link relationships
  const linkedPageIds = new Set<string>();
  edgeMap.forEach((targets, source) => {
    linkedPageIds.add(source);
    targets.forEach((_, target) => linkedPageIds.add(target));
  });

  // Build nodes
  const nodes: GraphNode[] = pages.map(page => ({
    id: page.id,
    label: page.title,
    icon: page.icon,
    iconType: page.iconType,
    linkCount: linkCountMap.get(page.id) || 0,
    isOrphan: !linkedPageIds.has(page.id),
    isCurrent: page.id === currentPageId,
  }));

  // Build edges
  const links: GraphEdge[] = [];
  edgeMap.forEach((targets, source) => {
    targets.forEach((info) => {
      links.push({ source, target: info.target, type: info.type });
    });
  });

  return { nodes, links };
}

/**
 * Get link type: 'link' = [[]] bidirectional link, 'text' = plain text mention, null = no link
 */
function getLinkType(content: string, pageTitle: string): 'link' | 'text' | null {
  // Escape regex special characters
  const escapedTitle = pageTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Wiki link regex: [[page name]] or [[page name#block ID]] or [[page name|display text]]
  const wikiLinkPattern = new RegExp(
    `\\[\\[${escapedTitle}(?:#[^\\]|]*)?(?:\\|[^\\]]+)?\\]\\]`,
    'i'
  );

  // Check Wiki link first
  if (wikiLinkPattern.test(content)) {
    return 'link';
  }

  // Plain text match regex (preceded/followed by non-alphanumeric/non-Chinese or boundary)
  const textPattern = new RegExp(
    `(?:^|[^\\w\\u4e00-\\u9fff])${escapedTitle}(?:[^\\w\\u4e00-\\u9fff]|$)`,
    'i'
  );

  // Check plain text after removing Wiki links
  const contentWithoutWikiLinks = content.replace(/\[\[[^\]]+\]\]/g, '');
  if (textPattern.test(contentWithoutWikiLinks)) {
    return 'text';
  }

  return null;
}
