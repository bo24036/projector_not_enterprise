// Shared link normalization and parsing utilities used by Note and ReadingList domains.

// Add https:// to a bare URL if no protocol is present.
export function normalizeUrl(url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

// Normalize a raw link field before storing.
// Handles plain URLs and markdown [label](url) syntax.
// Ensures the URL portion always has a protocol.
export function normalizeLinkField(raw) {
  if (!raw?.trim()) return '';
  const trimmed = raw.trim();
  const markdownMatch = trimmed.match(/^\[(.+)\]\((.+)\)$/);
  if (markdownMatch) {
    const label = markdownMatch[1];
    const url = normalizeUrl(markdownMatch[2].trim());
    return `[${label}](${url})`;
  }
  return normalizeUrl(trimmed);
}

// Parse a stored link field for display. Returns { url, label } or null if empty.
// label is null for plain URLs; a string for markdown [label](url) syntax.
export function parseLinkField(raw) {
  if (!raw?.trim()) return null;
  const trimmed = raw.trim();
  const markdownMatch = trimmed.match(/^\[(.+)\]\((.+)\)$/);
  if (markdownMatch) {
    return { label: markdownMatch[1].trim(), url: markdownMatch[2].trim() };
  }
  return { label: null, url: trimmed };
}
