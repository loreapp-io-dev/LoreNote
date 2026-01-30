/**
 * wikiLinkService - Wiki Link Parsing Service
 *
 * Responsible for:
 * - Parsing [[]] syntax
 * - Title to ID mapping
 * - Updating references when pages are renamed
 */

import type { PageReference } from '@/types';

/** Parsed Wiki Link */
export interface ParsedWikiLink {
  raw: string;           // Original text "[[Page Title|Display Text]]"
  targetTitle: string;   // Target page title
  targetPageId?: string; // Resolved pageId
  displayText?: string;  // Display text (alias)
  blockId?: string;      // Block ID (if any)
  isValid: boolean;      // Whether target page exists
  start: number;         // Start position in text
  end: number;           // End position
}

// Wiki link regex: matches [[title]] or [[title|alias]] or [[title#blockId]] or [[title#blockId|alias]]
const WIKI_LINK_REGEX = /\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g;

/**
 * Parse all Wiki links in text
 */
export function parseWikiLinks(
  content: string,
  pages?: PageReference[]
): ParsedWikiLink[] {
  const links: ParsedWikiLink[] = [];
  let match: RegExpExecArray | null;

  // Reset regex state
  WIKI_LINK_REGEX.lastIndex = 0;

  console.log('[wikiLinkService] parseWikiLinks()', { content: content.slice(0, 100), pagesCount: pages?.length });

  while ((match = WIKI_LINK_REGEX.exec(content)) !== null) {
    const [raw, title, blockId, displayText] = match;
    const targetTitle = title.trim();

    // Find matching page
    let targetPageId: string | undefined;
    let isValid = false;

    if (pages) {
      const page = pages.find(
        p => p.title.toLowerCase() === targetTitle.toLowerCase()
      );
      if (page) {
        targetPageId = page.id;
        isValid = true;
      }
      console.log('[wikiLinkService] parseWikiLinks() matching', { targetTitle, foundPage: !!page, targetPageId });
    }

    links.push({
      raw,
      targetTitle,
      targetPageId,
      displayText: displayText?.trim(),
      blockId: blockId?.trim(),
      isValid,
      start: match.index,
      end: match.index + raw.length,
    });
  }

  return links;
}

/**
 * Find page ID by title
 */
export function resolvePageTitle(
  pages: PageReference[],
  title: string
): string | null {
  const page = pages.find(
    p => p.title.toLowerCase() === title.toLowerCase()
  );
  return page?.id || null;
}

/**
 * Search for matching pages (for autocomplete)
 */
export function searchPages(
  pages: PageReference[],
  query: string,
  limit = 10
): PageReference[] {
  if (!query) return pages.slice(0, limit);

  const lowerQuery = query.toLowerCase();
  return pages
    .filter(p => p.title.toLowerCase().includes(lowerQuery))
    .sort((a, b) => {
      // Prioritize results that start with the query
      const aStarts = a.title.toLowerCase().startsWith(lowerQuery);
      const bStarts = b.title.toLowerCase().startsWith(lowerQuery);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.title.localeCompare(b.title);
    })
    .slice(0, limit);
}

/**
 * Check if text is currently typing a Wiki link
 * Returns the query text after [[, or null if not in typing state
 */
export function getWikiLinkQuery(text: string): string | null {
  // Match content after [[, but cannot contain ]]
  const match = text.match(/\[\[([^\]]*?)$/);
  return match ? match[1] : null;
}

/**
 * Replace Wiki link query with complete link
 */
export function completeWikiLink(
  text: string,
  pageTitle: string
): string {
  return text.replace(/\[\[[^\]]*$/, `[[${pageTitle}]]`);
}

/**
 * Update page references in text (for page renaming)
 */
export function updatePageReferences(
  content: string,
  oldTitle: string,
  newTitle: string
): string {
  // Match [[oldTitle]] or [[oldTitle|alias]] or [[oldTitle#blockId]] etc.
  const escapedOldTitle = oldTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(
    `\\[\\[${escapedOldTitle}(#[^\\]|]*)?(?:\\|([^\\]]+))?\\]\\]`,
    'gi'
  );

  return content.replace(regex, (_match, blockPart, aliasPart) => {
    let result = `[[${newTitle}`;
    if (blockPart) result += blockPart;
    if (aliasPart) result += `|${aliasPart}`;
    result += ']]';
    return result;
  });
}
