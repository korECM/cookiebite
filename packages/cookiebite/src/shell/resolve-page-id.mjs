/**
 * Hash → 활성 page id. 빈/미지 hash면 첫 페이지.
 * @param {string} hash location.hash (# 포함 가능)
 * @param {readonly string[]} pageIds
 * @returns {string}
 */
export function resolveInitialPageId(hash, pageIds) {
  if (!pageIds.length) return '';
  const raw = String(hash ?? '');
  const id = (raw.startsWith('#') ? raw.slice(1) : raw).trim();
  if (id && pageIds.includes(id)) return id;
  return pageIds[0];
}
