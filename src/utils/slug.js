export function toSlug(str) {
  if (!str) return '';
  return String(str).trim().replace(/\s+/g, '-');
} 