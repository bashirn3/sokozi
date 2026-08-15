/**
 * Fallback imagery for the category tiles, keyed by category handle.
 *
 * The category's own `metadata.image_url` wins when it is set, so a shop owner
 * can change these from admin without a deploy. This map covers databases
 * seeded before that metadata existed, and any category that has none.
 *
 * IMPORTANT, before adding or changing any image here:
 *
 * These are placeholders and must be replaced with real product photography
 * before launch. Until then, every URL must be a genuine photograph.
 * Unsplash's search results are now dominated by AI-generated uploads, and one
 * slipped into this project already. Two checks, both required:
 *
 *   1. The numeric part of an Unsplash photo id is its upload timestamp in
 *      milliseconds. Anything from 2023 onward is suspect. Every image used
 *      here was uploaded between 2015 and 2021.
 *   2. Look at the image before committing it. Generated product shots give
 *      themselves away with invented brand words and warped fine print.
 *
 * A URL returning 200 with real image bytes proves nothing about whether a
 * camera was involved.
 */
export const CATEGORY_IMAGES: Record<string, string> = {
  electronics:
    "https://images.unsplash.com/photo-1547489401-fcada4966052?w=1200&auto=format&fit=crop",
  fashion:
    "https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?w=1200&auto=format&fit=crop",
  home: "https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=1200&auto=format&fit=crop",
  beauty:
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200&auto=format&fit=crop",
}

/**
 * Resolves a category's tile image, preferring what the backend holds.
 */
export const getCategoryImage = (
  handle?: string | null,
  metadata?: Record<string, unknown> | null
): string | null => {
  const fromMetadata = metadata?.image_url
  if (typeof fromMetadata === "string" && fromMetadata.length > 0) {
    return fromMetadata
  }
  return handle ? CATEGORY_IMAGES[handle] ?? null : null
}
