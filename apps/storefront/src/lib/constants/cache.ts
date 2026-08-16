/**
 * How long catalogue data may be served from cache, in seconds.
 *
 * The catalogue fetches ask for `force-cache` and carry a cache tag, but the
 * only things that ever call revalidateTag for those tags are placing an order
 * and changing region. Nothing in Medusa tells the storefront that a product
 * was added, edited or deleted, so without a window the cache holds until the
 * container restarts. A product created in the admin was measured as still
 * missing from the home, store and category pages ninety seconds later, on a
 * container that had been up for seven hours.
 *
 * Sixty seconds bounds that. It is a ceiling on how stale the shop can be, not
 * a delay: a page whose cache entry has expired fetches fresh data on the next
 * request.
 *
 * This belongs only on catalogue data, which is the same for every visitor.
 * Carts, customers, orders, payments and fulfilment stay tag-driven, because
 * they are per-user and must never be served from a shared window.
 */
export const CATALOGUE_REVALIDATE_SECONDS = 60
