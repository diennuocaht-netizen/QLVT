/**
 * Utilities for accent-insensitive and flexible text searching (Vietnamese support)
 */

export function removeAccents(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, (m) => (m === 'đ' ? 'd' : 'D'));
}

export function normalizeSearchText(str: string): string {
  if (!str) return '';
  return removeAccents(str)
    .toLowerCase()
    .replace(/[-_/\\.,;:()+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if a target text matches a query string.
 * Supports:
 * - Case insensitivity
 * - Vietnamese accent insensitivity (e.g. "ac quy" matches "Ắc quy")
 * - Punctuation tolerance (e.g. "12v 105ah" matches "12V-105Ah")
 * - Multi-word searching in any order (e.g. "fiamm 105" matches "Ắc quy Fiamm 12V-105Ah")
 */
export function matchesSearch(text: string | null | undefined, query: string): boolean {
  if (!query || !query.trim()) return true;
  if (!text) return false;

  const normText = normalizeSearchText(text);
  const normQuery = normalizeSearchText(query);

  if (!normQuery) return true;

  // Direct substring match
  if (normText.includes(normQuery)) return true;

  // Multi-word matching: all query words must appear in target text
  const queryWords = normQuery.split(' ').filter(Boolean);
  if (queryWords.length > 1) {
    return queryWords.every(word => normText.includes(word));
  }

  return false;
}

/**
 * Filter option helper for react-select components
 */
export function filterSelectOption(
  candidate: { label: string; value: string; data?: any },
  input: string
): boolean {
  if (!input || !input.trim()) return true;
  
  // Search in label
  if (matchesSearch(candidate.label, input)) return true;
  
  // Search in candidate data if it has code/name/category
  if (candidate.data) {
    if (matchesSearch(candidate.data.code, input)) return true;
    if (matchesSearch(candidate.data.name, input)) return true;
    if (matchesSearch(candidate.data.category, input)) return true;
  }
  
  return false;
}
