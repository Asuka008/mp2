export interface ArtworkNavigation {
  ids: number[];
  source: 'list' | 'gallery' | 'default';
  returnTo?: string;
}

export function parseArtworkId(value: string | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/** Router history state survives refresh, but is absent on a new direct link. */
export function readArtworkNavigation(state: unknown, id: number): ArtworkNavigation | null {
  if (!state || typeof state !== 'object' || !('artworkNavigation' in state)) return null;
  const context = state.artworkNavigation;
  if (!context || typeof context !== 'object' || !('ids' in context) || !('source' in context)) return null;
  const { ids, source } = context;
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 101
    || !ids.every((item) => typeof item === 'number' && Number.isSafeInteger(item) && item > 0)
    || new Set(ids).size !== ids.length || !ids.includes(id)
    || (source !== 'list' && source !== 'gallery' && source !== 'default')) return null;
  const returnTo = 'returnTo' in context && typeof context.returnTo === 'string'
    && (context.returnTo === '/' || context.returnTo.startsWith('/?')
      || context.returnTo === '/gallery' || context.returnTo.startsWith('/gallery?'))
    ? context.returnTo : undefined;
  return { ids, source, ...(returnTo ? { returnTo } : {}) };
}

export function getArtworkNeighbors(ids: number[], id: number) {
  const index = ids.indexOf(id);
  return {
    index,
    previous: index >= 0 && ids.length > 1 ? ids[(index - 1 + ids.length) % ids.length] : null,
    next: index >= 0 && ids.length > 1 ? ids[(index + 1) % ids.length] : null,
  };
}
