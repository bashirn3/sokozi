import { ExecArgs } from '@medusajs/framework/types'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import { createOffersWorkflow, createSellersWorkflow } from '@mercurjs/core/workflows'

/**
 * Make Sokozi its own first vendor.
 *
 * Mercur does not read a price off a variant. `/store/products` computes
 * `variants.calculated_price` from the cheapest Offer attached to that
 * variant, so a catalogue migrated into Mercur serves with a null price until
 * every variant carries one. This script closes that gap for the products
 * Sokozi already sells: it creates one seller, links every product to it, and
 * gives each variant an offer carrying the price and stock the variant
 * already had.
 *
 * It is written to be re-runnable. Each stage checks for its own output
 * first, so a partial run can be finished by running it again rather than by
 * unpicking rows by hand.
 *
 * Run with:  npx medusa exec ./src/scripts/backfill-sokozi-seller.ts
 */

/**
 * The offer rows handed to createOffersWorkflow. Declared rather than inferred
 * because an empty literal would otherwise widen to never[] and reject every
 * push.
 */
type OfferInput = {
  seller_id: string
  created_by: string
  sku: string
  variant_id: string
  shipping_profile_id: string
  prices: { amount: number; currency_code: string }[]
  inventory_items: {
    sku: string
    required_quantity: number
    stock_levels: { location_id: string; stocked_quantity: number }[]
  }[]
}

const SELLER_HANDLE = 'sokozi'
const SELLER_NAME = 'Sokozi'
const SELLER_EMAIL = 'bashirrn3@gmail.com'
const CURRENCY = 'tzs'

export default async function backfillSokoziSeller({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const link = container.resolve(ContainerRegistrationKeys.LINK)

  // ---------------------------------------------------------------- seller

  const { data: existingSellers } = await query.graph({
    entity: 'seller',
    fields: ['id', 'handle', 'status'],
    filters: { handle: SELLER_HANDLE },
  })

  let sellerId = existingSellers[0]?.id

  if (sellerId) {
    logger.info(`Seller "${SELLER_HANDLE}" already exists (${sellerId}).`)
  } else {
    // status defaults to pending_approval, which would hide the storefront's
    // own products behind an approval step it has no one to perform.
    const { result } = await createSellersWorkflow(container).run({
      input: {
        sellers: [
          {
            name: SELLER_NAME,
            handle: SELLER_HANDLE,
            email: SELLER_EMAIL,
            currency_code: CURRENCY,
            status: 'open',
            member: { email: SELLER_EMAIL },
          },
        ],
      },
    })
    sellerId = result[0].id
    logger.info(`Created seller "${SELLER_HANDLE}" (${sellerId}).`)
  }

  // --------------------------------------------------------------- linking

  const { data: products } = await query.graph({
    entity: 'product',
    fields: ['id', 'title', 'variants.id', 'variants.sku', 'variants.title'],
  })

  const { data: alreadyLinked } = await query.graph({
    entity: 'seller',
    fields: ['products.id'],
    filters: { id: sellerId },
  })
  // query.graph types every relation element as possibly null, so each list is
  // narrowed before use rather than trusted.
  const linkedProductIds = new Set(
    (alreadyLinked[0]?.products ?? []).flatMap((p) => (p?.id ? [p.id] : []))
  )

  const linksToCreate = products
    .filter((p) => !linkedProductIds.has(p.id))
    .map((p) => ({
      [Modules.PRODUCT]: { product_id: p.id },
      seller: { seller_id: sellerId },
    }))

  if (linksToCreate.length) {
    await link.create(linksToCreate)
  }
  logger.info(
    `Linked ${linksToCreate.length} product(s) to the seller ` +
      `(${linkedProductIds.size} already linked).`
  )

  // ---------------------------------------------------------------- offers

  // The offer needs somewhere to ship from and a profile to ship on. Sokozi
  // is vendor zero, so it inherits the ones the original seed created rather
  // than standing up a second warehouse alongside the real one.
  const { data: shippingProfiles } = await query.graph({
    entity: 'shipping_profile',
    fields: ['id', 'name'],
  })
  const { data: stockLocations } = await query.graph({
    entity: 'stock_location',
    fields: ['id', 'name'],
  })

  const shippingProfileId = shippingProfiles[0]?.id
  const stockLocationId = stockLocations[0]?.id

  if (!shippingProfileId) {
    throw new Error('No shipping profile found. Seed one before backfilling.')
  }
  if (!stockLocationId) {
    throw new Error('No stock location found. Seed one before backfilling.')
  }

  // ---------------------------------------------------- fulfillment ownership

  // Mercur filters shipping options by seller, because in a marketplace each
  // vendor ships from its own places on its own terms. A vendor onboarding
  // through the vendor panel creates that infrastructure as it goes, so these
  // links come into being on their own. Sokozi is not onboarding — its
  // warehouse, delivery options and shipping profile already exist from the
  // seed and predate the seller entirely.
  //
  // Without these links the store looks completely healthy right up to
  // checkout, where /store/shipping-options returns an empty list and the
  // order cannot be placed. Linking is what makes the existing infrastructure
  // Sokozi's, so the delivery options it already had keep being offered.
  const { data: fulfillmentSets } = await query.graph({
    entity: 'fulfillment_set',
    fields: ['id', 'name'],
  })
  const { data: serviceZones } = await query.graph({
    entity: 'service_zone',
    fields: ['id', 'name'],
  })
  const { data: shippingOptions } = await query.graph({
    entity: 'shipping_option',
    fields: ['id', 'name'],
  })

  const owned = await query.graph({
    entity: 'seller',
    fields: [
      'stock_locations.id',
      'shipping_profiles.id',
      'shipping_options.id',
      'fulfillment_sets.id',
      'service_zones.id',
    ],
    filters: { id: sellerId },
  })
  const already = (relation: string) =>
    new Set(
      (
        ((owned.data[0] as Record<string, unknown>)?.[relation] as
          | { id?: string }[]
          | undefined) ?? []
      ).flatMap((r) => (r?.id ? [r.id] : []))
    )

  const fulfillmentLinks = [
    ...stockLocations
      .filter((l) => l?.id && !already('stock_locations').has(l.id))
      .map((l) => ({
        [Modules.STOCK_LOCATION]: { stock_location_id: l.id },
        seller: { seller_id: sellerId },
      })),
    ...shippingProfiles
      .filter((p) => p?.id && !already('shipping_profiles').has(p.id))
      .map((p) => ({
        [Modules.FULFILLMENT]: { shipping_profile_id: p.id },
        seller: { seller_id: sellerId },
      })),
    ...shippingOptions
      .filter((o) => o?.id && !already('shipping_options').has(o.id))
      .map((o) => ({
        [Modules.FULFILLMENT]: { shipping_option_id: o.id },
        seller: { seller_id: sellerId },
      })),
    ...fulfillmentSets
      .filter((f) => f?.id && !already('fulfillment_sets').has(f.id))
      .map((f) => ({
        seller: { seller_id: sellerId },
        [Modules.FULFILLMENT]: { fulfillment_set_id: f.id },
      })),
    ...serviceZones
      .filter((z) => z?.id && !already('service_zones').has(z.id))
      .map((z) => ({
        seller: { seller_id: sellerId },
        [Modules.FULFILLMENT]: { service_zone_id: z.id },
      })),
  ]

  if (fulfillmentLinks.length) {
    await link.create(fulfillmentLinks)
  }
  logger.info(
    `Linked ${fulfillmentLinks.length} fulfillment record(s) to the seller ` +
      `(locations, profiles, options, sets, zones).`
  )

  const { data: existingOffers } = await query.graph({
    entity: 'offer',
    fields: ['id', 'variant_id'],
    filters: { seller_id: sellerId },
  })
  const offeredVariantIds = new Set(
    existingOffers.map((o: { variant_id: string }) => o.variant_id)
  )

  // Price and stock are read off what the variant already has, so the
  // storefront shows the same numbers after the backfill as before it.
  const { data: variants } = await query.graph({
    entity: 'product_variant',
    fields: [
      'id',
      'sku',
      'title',
      'product.id',
      'price_set.prices.amount',
      'price_set.prices.currency_code',
      'inventory_items.inventory.location_levels.stocked_quantity',
    ],
  })

  const offers: OfferInput[] = []
  const skipped: string[] = []

  for (const variant of variants) {
    if (offeredVariantIds.has(variant.id)) {
      continue
    }

    const prices = (variant.price_set?.prices ?? []).flatMap((p) =>
      p?.amount != null && p?.currency_code
        ? [{ amount: p.amount, currency_code: p.currency_code }]
        : []
    )

    if (!prices.length) {
      skipped.push(`${variant.sku ?? variant.id} (no price)`)
      continue
    }

    // Offer SKUs are unique per seller, so a variant without one would
    // collide with every other variant that lacks one.
    const sku = variant.sku ?? `${SELLER_HANDLE}-${variant.id}`

    const stockedQuantity =
      variant.inventory_items?.[0]?.inventory?.location_levels?.[0]
        ?.stocked_quantity ?? 0

    offers.push({
      seller_id: sellerId,
      created_by: 'backfill',
      sku,
      variant_id: variant.id,
      shipping_profile_id: shippingProfileId,
      prices,
      // createOffersWorkflow always mints fresh inventory items for the offer
      // rather than adopting the variant's, so the quantity has to be carried
      // across explicitly or the offer lands out of stock. Inventory SKUs are
      // unique across the whole store, and the seed already used the variant's
      // SKU for the variant's own item, so the offer's item is namespaced by
      // seller. That leaves the seed's items behind, still linked to the
      // variants but no longer the stock anything sells from — in Mercur the
      // variant is a catalogue entry and the offer holds the stock. Retiring
      // them is a follow-up, not something to do mid-backfill.
      inventory_items: [
        {
          sku: `${SELLER_HANDLE}-${sku}`,
          required_quantity: 1,
          stock_levels: [
            { location_id: stockLocationId, stocked_quantity: stockedQuantity },
          ],
        },
      ],
    })
  }

  if (offers.length) {
    await createOffersWorkflow(container).run({ input: { offers } })
  }

  logger.info(
    `Created ${offers.length} offer(s). ` +
      `${offeredVariantIds.size} variant(s) already had one.`
  )
  if (skipped.length) {
    logger.warn(`Skipped ${skipped.length}: ${skipped.join(', ')}`)
  }

  logger.info('Backfill complete.')
}
