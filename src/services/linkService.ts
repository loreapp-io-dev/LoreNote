/**
 * linkService - Bidirectional Link Management Service
 *
 * Responsible for:
 * - Creating, updating, and deleting links
 * - Maintaining backlink index
 * - Validating link validity
 * - Persisting link-related data
 */

import { fs } from './fs';
import type {
  LinkMetadata,
  BacklinkRecord,
  LinkIndex,
  BrokenLinkRecord,
  LinkValidationResult,
  PageReference,
} from '@/types';
import { traverseComponents, type SchemaComponent } from '@/engine-v8';
import { parseWikiLinks } from './wikiLinkService';

const VAULT_METADATA_DIR = '.lorenote';
const VAULT_METADATA_FILE = 'vault.json';

/**
 * Extract all links from component tree
 */
export function extractLinksFromComponent(
  component: SchemaComponent,
  pageId: string,
  pages?: PageReference[]
): LinkMetadata[] {
  const links: LinkMetadata[] = [];

  traverseComponents(component, (comp) => {
    // Check if it's a link block
    if (comp.element === 'link' && comp.data) {
      const data = comp.data as { targetPageId?: string; targetBlockId?: string };
      if (data.targetPageId) {
        links.push({
          id: `${pageId}-${comp.id || ''}`,
          targetPageId: data.targetPageId,
          targetBlockId: data.targetBlockId,
          sourceBlockId: comp.id || '',
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Check for [[]] Wiki link syntax in all components
    if (comp.data) {
      const data = comp.data as { formats?: Array<{ type: string; value?: string }>; content?: string };

      // Check links in formats
      if (data.formats) {
        data.formats.forEach((format, index) => {
          if (format.type === 'link' && format.value?.startsWith('page:')) {
            const linkPart = format.value.slice(5);
            const [targetPageId, targetBlockId] = linkPart.split('#');
            links.push({
              id: `${pageId}-${comp.id || ''}-${index}`,
              targetPageId,
              targetBlockId,
              sourceBlockId: comp.id || '',
              createdAt: new Date().toISOString(),
            });
          }
        });
      }

      // Check for [[]] Wiki links in content
      if (data.content && typeof data.content === 'string') {
        const wikiLinks = parseWikiLinks(data.content, pages);
        console.log('[linkService] extractLinksFromComponent() found wiki links in content', { content: data.content.slice(0, 100), wikiLinksCount: wikiLinks.length, wikiLinks });
        wikiLinks.forEach((link, index) => {
          if (link.targetPageId) {
            links.push({
              id: `${pageId}-${comp.id || ''}-wiki-${index}`,
              targetPageId: link.targetPageId,
              targetBlockId: link.blockId,
              sourceBlockId: comp.id || '',
              createdAt: new Date().toISOString(),
            });
          }
        });
      }
    }
  });

  return links;
}

/**
 * Read vault's link index
 */
export async function readLinkIndex(vaultPath: string): Promise<LinkIndex> {
  try {
    const metadataPath = `${vaultPath}/${VAULT_METADATA_DIR}/${VAULT_METADATA_FILE}`;
    const content = await fs.readJson<{ linkIndex?: LinkIndex }>(metadataPath);
    return content?.linkIndex || {};
  } catch {
    return {};
  }
}

/**
 * Save vault's link index
 */
export async function saveLinkIndex(vaultPath: string, linkIndex: LinkIndex): Promise<void> {
  try {
    const metadataPath = `${vaultPath}/${VAULT_METADATA_DIR}/${VAULT_METADATA_FILE}`;
    const content = await fs.readJson<Record<string, unknown>>(metadataPath);
    if (!content) return;
    content.linkIndex = linkIndex;
    await fs.writeJson(metadataPath, content);
  } catch (error) {
    console.error('Failed to save link index:', error);
  }
}

/**
 * Update link index for specified page
 */
export async function updateLinksForPage(
  vaultPath: string,
  pageId: string,
  pageTitle: string,
  component: SchemaComponent,
  pages?: PageReference[]
): Promise<void> {
  console.log('[linkService] updateLinksForPage() called', { pageId, pageTitle, hasPages: !!pages, pagesCount: pages?.length });

  // Extract all links from the page
  const links = extractLinksFromComponent(component, pageId, pages);
  console.log('[linkService] updateLinksForPage() extracted links', { linksCount: links.length, links: links.map(l => ({ targetPageId: l.targetPageId, sourceBlockId: l.sourceBlockId })) });

  // Read current index
  const linkIndex = await readLinkIndex(vaultPath);

  // Clear all previous backlinks from this page
  for (const targetId of Object.keys(linkIndex)) {
    linkIndex[targetId] = linkIndex[targetId].filter(
      (record) => record.sourcePageId !== pageId
    );
    // Clean up empty arrays
    if (linkIndex[targetId].length === 0) {
      delete linkIndex[targetId];
    }
  }

  // Add new backlinks
  for (const link of links) {
    if (!linkIndex[link.targetPageId]) {
      linkIndex[link.targetPageId] = [];
    }

    // Get preview text for the link block
    let preview = '';
    traverseComponents(component, (comp) => {
      if (comp.id === link.sourceBlockId && comp.data) {
        const data = comp.data as { content?: string };
        if (data.content) {
          preview = data.content.slice(0, 100);
        }
      }
    });

    linkIndex[link.targetPageId].push({
      sourcePageId: pageId,
      sourcePageTitle: pageTitle,
      sourceBlockId: link.sourceBlockId,
      sourceBlockPreview: preview,
      createdAt: link.createdAt,
    });
  }

  console.log('[linkService] updateLinksForPage() saving linkIndex', { indexKeys: Object.keys(linkIndex) });
  // Save updated index
  await saveLinkIndex(vaultPath, linkIndex);
}

/**
 * Get backlinks for specified page
 */
export async function getBacklinksForPage(
  vaultPath: string,
  pageId: string
): Promise<BacklinkRecord[]> {
  const linkIndex = await readLinkIndex(vaultPath);
  return linkIndex[pageId] || [];
}

/**
 * Backlinks grouped by page
 */
export interface BacklinkGroup {
  sourcePageId: string;
  sourcePageTitle: string;
  blocks: BacklinkRecord[];
}

/**
 * Get backlinks grouped by page
 */
export async function getBacklinksGroupedByPage(
  vaultPath: string,
  pageId: string
): Promise<BacklinkGroup[]> {
  const backlinks = await getBacklinksForPage(vaultPath, pageId);
  const groupMap = new Map<string, BacklinkGroup>();

  for (const link of backlinks) {
    const existing = groupMap.get(link.sourcePageId);
    if (existing) {
      existing.blocks.push(link);
    } else {
      groupMap.set(link.sourcePageId, {
        sourcePageId: link.sourcePageId,
        sourcePageTitle: link.sourcePageTitle || link.sourcePageId,
        blocks: [link],
      });
    }
  }

  return Array.from(groupMap.values());
}

/**
 * Validate link validity
 */
export async function validateLink(
  vaultPath: string,
  targetPageId: string,
  targetBlockId?: string,
  pages?: PageReference[]
): Promise<LinkValidationResult> {
  // Check if page exists
  let pageExists = false;
  let pageTitle: string | undefined;

  if (pages) {
    const page = pages.find((p) => p.id === targetPageId);
    pageExists = !!page;
    pageTitle = page?.title;
  } else {
    // Check from file system
    try {
      const pagePath = `${vaultPath}/${targetPageId}.json`;
      pageExists = await fs.exists(pagePath);
      if (pageExists) {
        const pageContent = await fs.readJson<{ page?: { title?: string } }>(pagePath);
        pageTitle = pageContent?.page?.title;
      }
    } catch {
      pageExists = false;
    }
  }

  if (!pageExists) {
    return {
      isValid: false,
      pageExists: false,
      error: 'Target page does not exist',
    };
  }

  // If block ID is specified, check if block exists
  if (targetBlockId) {
    try {
      const pagePath = `${vaultPath}/${targetPageId}.json`;
      const pageContent = await fs.readJson<{ page?: { content?: SchemaComponent } }>(pagePath);
      if (pageContent?.page?.content) {
        let blockExists = false;
        traverseComponents(pageContent.page.content, (comp) => {
          if (comp.id === targetBlockId) {
            blockExists = true;
          }
        });

        return {
          isValid: blockExists,
          pageExists: true,
          blockExists,
          pageTitle,
          error: blockExists ? undefined : 'Target block does not exist',
        };
      }
    } catch {
      // Ignore error, return page exists but block unknown
    }
  }

  return {
    isValid: true,
    pageExists: true,
    pageTitle,
  };
}

/**
 * Batch validate all links in a page
 */
export async function validatePageLinks(
  vaultPath: string,
  pageId: string,
  component: SchemaComponent,
  pages?: PageReference[]
): Promise<BrokenLinkRecord[]> {
  const links = extractLinksFromComponent(component, pageId, pages);
  const brokenLinks: BrokenLinkRecord[] = [];

  for (const link of links) {
    const result = await validateLink(vaultPath, link.targetPageId, link.targetBlockId, pages);
    if (!result.isValid) {
      brokenLinks.push({
        sourcePageId: pageId,
        sourceBlockId: link.sourceBlockId,
        targetPageId: link.targetPageId,
        detectedAt: new Date().toISOString(),
      });
    }
  }

  return brokenLinks;
}

/**
 * Handle link updates when page is deleted
 */
export async function handlePageDeletion(
  vaultPath: string,
  deletedPageId: string
): Promise<void> {
  const linkIndex = await readLinkIndex(vaultPath);

  // Delete all backlinks where this page is the target
  delete linkIndex[deletedPageId];

  // Delete all backlinks where this page is the source
  for (const targetId of Object.keys(linkIndex)) {
    linkIndex[targetId] = linkIndex[targetId].filter(
      (record) => record.sourcePageId !== deletedPageId
    );
    if (linkIndex[targetId].length === 0) {
      delete linkIndex[targetId];
    }
  }

  await saveLinkIndex(vaultPath, linkIndex);
}

/**
 * Handle link updates when page title is updated
 */
export async function handlePageTitleUpdate(
  vaultPath: string,
  pageId: string,
  newTitle: string
): Promise<void> {
  const linkIndex = await readLinkIndex(vaultPath);

  // Update title for all backlinks from this page
  for (const targetId of Object.keys(linkIndex)) {
    linkIndex[targetId] = linkIndex[targetId].map((record) => {
      if (record.sourcePageId === pageId) {
        return { ...record, sourcePageTitle: newTitle };
      }
      return record;
    });
  }

  await saveLinkIndex(vaultPath, linkIndex);
}

/**
 * Rebuild entire vault's link index
 */
export async function rebuildLinkIndex(
  vaultPath: string,
  pages: PageReference[]
): Promise<LinkIndex> {
  const linkIndex: LinkIndex = {};

  for (const page of pages) {
    try {
      const pagePath = `${vaultPath}/${page.id}.json`;
      const pageContent = await fs.readJson<{ page?: { content?: SchemaComponent } }>(pagePath);

      if (pageContent?.page?.content) {
        const links = extractLinksFromComponent(pageContent.page.content, page.id, pages);

        for (const link of links) {
          if (!linkIndex[link.targetPageId]) {
            linkIndex[link.targetPageId] = [];
          }

          // Get preview text for the link block（扩展上下文）
          let preview = '';
          if (pageContent.page.content) {
            traverseComponents(pageContent.page.content, (comp) => {
              if (comp.id === link.sourceBlockId && comp.data) {
                const data = comp.data as { content?: string };
                if (data.content) {
                  preview = data.content.slice(0, 300);
                }
              }
            });
          }

          linkIndex[link.targetPageId].push({
            sourcePageId: page.id,
            sourcePageTitle: page.title,
            sourceBlockId: link.sourceBlockId,
            sourceBlockPreview: preview,
            createdAt: link.createdAt,
          });
        }
      }
    } catch (error) {
      console.warn(`Failed to process page ${page.id}:`, error);
    }
  }

  await saveLinkIndex(vaultPath, linkIndex);
  return linkIndex;
}

/**
 * Get link statistics
 */
export async function getLinkStats(
  vaultPath: string
): Promise<{
  totalLinks: number;
  pagesWithBacklinks: number;
  averageBacklinksPerPage: number;
}> {
  const linkIndex = await readLinkIndex(vaultPath);

  let totalLinks = 0;
  const pagesWithBacklinks = Object.keys(linkIndex).length;

  for (const backlinks of Object.values(linkIndex)) {
    totalLinks += backlinks.length;
  }

  return {
    totalLinks,
    pagesWithBacklinks,
    averageBacklinksPerPage: pagesWithBacklinks > 0 ? totalLinks / pagesWithBacklinks : 0,
  };
}

/** Bidirectional link mention record */
export interface BidirectionalMention {
  sourcePageId: string;
  sourcePageTitle: string;
  sourceBlockId: string;
  sourceBlockPreview: string;
  /** Mention type: link = [[]] bidirectional link, text = plain text mention */
  type: 'link' | 'text';
}

/** Bidirectional link group */
export interface BidirectionalLinkGroup {
  sourcePageId: string;
  sourcePageTitle: string;
  mentions: BidirectionalMention[];
}

/**
 * Get bidirectional links (including [[]] links and plain text mentions)
 */
export async function getBidirectionalLinks(
  vaultPath: string,
  pageId: string,
  pageTitle: string,
  pages: PageReference[]
): Promise<BidirectionalLinkGroup[]> {
  const mentions: BidirectionalMention[] = [];
  // For deduplication: pageId + blockId
  const seenBlocks = new Set<string>();

  // Escape regex special characters
  const escapedTitle = pageTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Wiki link regex
  const wikiLinkPattern = new RegExp(
    `\\[\\[${escapedTitle}(?:#[^\\]|]*)?(?:\\|[^\\]]+)?\\]\\]`,
    'gi'
  );
  // Plain text match regex (preceded/followed by non-alphanumeric/non-Chinese or boundary)
  const textPattern = new RegExp(
    `(?:^|[^\\w\\u4e00-\\u9fff])${escapedTitle}(?:[^\\w\\u4e00-\\u9fff]|$)`,
    'gi'
  );

  // Traverse all pages to find mentions
  for (const page of pages) {
    // Skip current page
    if (page.id === pageId) continue;

    try {
      const pagePath = `${vaultPath}/${page.id}.json`;
      const pageContent = await fs.readJson<{ page?: { content?: SchemaComponent } }>(pagePath);

      if (pageContent?.page?.content) {
        traverseComponents(pageContent.page.content, (comp) => {
          if (comp.data) {
            const data = comp.data as { content?: string };
            if (data.content && typeof data.content === 'string') {
              const blockKey = `${page.id}-${comp.id || ''}`;
              if (seenBlocks.has(blockKey)) return;

              // Reset regex state
              wikiLinkPattern.lastIndex = 0;
              textPattern.lastIndex = 0;

              // First check for Wiki links
              const hasWikiLink = wikiLinkPattern.test(data.content);
              // Remove Wiki links then check for plain text mentions
              const contentWithoutWikiLinks = data.content.replace(wikiLinkPattern, '');
              textPattern.lastIndex = 0;
              const hasTextMention = textPattern.test(contentWithoutWikiLinks);

              // Determine mention type: prioritize bidirectional links
              if (hasWikiLink || hasTextMention) {
                seenBlocks.add(blockKey);
                mentions.push({
                  sourcePageId: page.id,
                  sourcePageTitle: page.title,
                  sourceBlockId: comp.id || '',
                  sourceBlockPreview: data.content.slice(0, 200),
                  type: hasWikiLink ? 'link' : 'text',
                });
              }
            }
          }
        });
      }
    } catch (error) {
      console.warn(`Failed to check mentions in page ${page.id}:`, error);
    }
  }

  // Group by page
  const groupMap = new Map<string, BidirectionalLinkGroup>();
  for (const mention of mentions) {
    const existing = groupMap.get(mention.sourcePageId);
    if (existing) {
      existing.mentions.push(mention);
    } else {
      groupMap.set(mention.sourcePageId, {
        sourcePageId: mention.sourcePageId,
        sourcePageTitle: mention.sourcePageTitle,
        mentions: [mention],
      });
    }
  }

  return Array.from(groupMap.values());
}

