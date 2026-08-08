// Pure path helpers, no imports — safe for both the browser bundle and route handlers.
// Kept out of galleryStore.ts on purpose: that module pulls in the server-side
// @vercel/blob SDK, which must not end up in the client bundle.

/**
 * Video poster frames live at `_meta/posters/<video pathname minus its prefix>.jpg`.
 * Deterministic, so a clip and its still can be paired back up on read — and under
 * `_meta/` so they never surface as gallery tiles of their own.
 */
export const POSTER_PREFIX = '_meta/posters/'

export function posterPathFor(videoPathname: string): string {
  return POSTER_PREFIX + videoPathname.replace(/^gallery\//, '') + '.jpg'
}
