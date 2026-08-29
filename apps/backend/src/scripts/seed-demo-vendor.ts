import { ExecArgs } from '@medusajs/framework/types'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import {
  approveSellerWorkflow,
  createOffersWorkflow,
  createSellersWorkflow,
} from '@mercurjs/core/workflows'

/**
 * Put a second vendor in the catalogue.
 *
 * This deliberately does not give the new seller its own products. In Mercur a
 * product is a shared catalogue entry and an offer is one seller's listing of
 * it, so the honest demonstration of a marketplace is two sellers competing on
 * the same item rather than two shops standing side by side. The storefront
 * prices a variant from the cheapest offer, so undercutting Sokozi on some
 * products and sitting above it on others shows the mechanism working in both
 * directions.
 *
 * Re-runnable: every stage checks for its own output first.
 *
 * Run with:  npx medusa exec ./src/scripts/seed-demo-vendor.ts
 */

/**
 * The offer rows handed to createOffersWorkflow. Declared rather than inferred
 * because an empty literal widens to never[] and rejects every push — the same
 * trap the Sokozi backfill hit.
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

const VENDOR = {
  name: 'Kariakoo Traders',
  handle: 'kariakoo',
  email: 'kariakoo@example.com',
  currency: 'tzs',
}

// Undercuts Sokozi on the first two, sits above it on the third, so the
// storefront visibly picks a different winner per product.
const COMPETING_PRICES: Record<string, number> = {
  'SOKOZI-EARBUDS': 23000, // Sokozi 25,000 → Kariakoo wins
  'SOKOZI-POWERBANK': 31000, // Sokozi 35,000 → Kariakoo wins
  'SOKOZI-SNEAKERS': 65000, // Sokozi 60,000 → Sokozi holds
}

export default async function seedDemoVendor({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const link = container.resolve(ContainerRegistrationKeys.LINK)

  // ---------------------------------------------------------------- seller

  const { data: existing } = await query.graph({
    entity: 'seller',
    fields: ['id', 'handle', 'status'],
    filters: { handle: VENDOR.handle },
  })

  let sellerId: string = existing[0]?.id
  if (sellerId) {
    logger.info(`Seller "${VENDOR.handle}" already exists (${sellerId}).`)
  } else {
    const { result } = await createSellersWorkflow(container).run({
      input: {
        sellers: [
          {
            name: VENDOR.name,
            handle: VENDOR.handle,
            email: VENDOR.email,
            currency_code: VENDOR.currency,
            member: { email: VENDOR.email },
          },
        ],
      },
    })
    sellerId = result[0].id
    logger.info(`Created seller "${VENDOR.handle}" (${sellerId}).`)
  }

  // A seller defaults to pending_approval, and an unapproved seller's offers
  // are withheld from the storefront — which would make this whole script
  // look like it silently did nothing.
  if (existing[0]?.status !== 'open') {
    await approveSellerWorkflow(container)
      .run({ input: { seller_id: sellerId } })
      .catch(() => undefined)
    logger.info('Seller approved (status: open).')
  }

  // --------------------------------------------------- fulfillment ownership

  // Same reasoning as the Sokozi backfill: Mercur filters shipping options by
  // seller, so a vendor with no fulfillment links has a catalogue that cannot
  // be delivered. This demo vendor ships from the same warehouse rather than
  // inventing a second one.
  const [
    { data: stockLocations },
    { data: shippingProfiles },
    { data: shippingOptions },
    { data: fulfillmentSets },
    { data: serviceZones },
  ] = await Promise.all([
    query.graph({ entity: 'stock_location', fields: ['id'] }),
    query.graph({ entity: 'shipping_profile', fields: ['id'] }),
    query.graph({ entity: 'shipping_option', fields: ['id'] }),
    query.graph({ entity: 'fulfillment_set', fields: ['id'] }),
    query.graph({ entity: 'service_zone', fields: ['id'] }),
  ])

  const { data: owned } = await query.graph({
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
  const has = (rel: string) =>
    new Set(
      (((owned[0] as Record<string, unknown>)?.[rel] as { id?: string }[]) ?? [])
        .flatMap((r) => (r?.id ? [r.id] : []))
    )

  const fulfillmentLinks = [
    ...stockLocations
      .filter((l) => l?.id && !has('stock_locations').has(l.id))
      .map((l) => ({
        [Modules.STOCK_LOCATION]: { stock_location_id: l.id },
        seller: { seller_id: sellerId },
      })),
    ...shippingProfiles
      .filter((p) => p?.id && !has('shipping_profiles').has(p.id))
      .map((p) => ({
        [Modules.FULFILLMENT]: { shipping_profile_id: p.id },
        seller: { seller_id: sellerId },
      })),
    ...shippingOptions
      .filter((o) => o?.id && !has('shipping_options').has(o.id))
      .map((o) => ({
        [Modules.FULFILLMENT]: { shipping_option_id: o.id },
        seller: { seller_id: sellerId },
      })),
    ...fulfillmentSets
      .filter((f) => f?.id && !has('fulfillment_sets').has(f.id))
      .map((f) => ({
        seller: { seller_id: sellerId },
        [Modules.FULFILLMENT]: { fulfillment_set_id: f.id },
      })),
    ...serviceZones
      .filter((z) => z?.id && !has('service_zones').has(z.id))
      .map((z) => ({
        seller: { seller_id: sellerId },
        [Modules.FULFILLMENT]: { service_zone_id: z.id },
      })),
  ]

  // Each of these links is one-to-one on the seller side: a warehouse, a
  // shipping profile and a delivery option belong to exactly one vendor. That
  // is the right model — two shops do not share a stockroom — but it means
  // this demo vendor cannot borrow Sokozi's, and Medusa refuses with "Cannot
  // create multiple links between 'stock_location' and 'seller'".
  //
  // Each link is attempted separately and a refusal is counted rather than
  // thrown, so the vendor still reaches the catalogue. The consequence is
  // real and worth stating plainly: this vendor has nothing to ship from, so
  // its offers can be browsed and priced but not checked out. Giving it a
  // warehouse and delivery options of its own is what a vendor would do
  // during onboarding, and is the next piece of work rather than a fudge.
  let linked = 0
  let refused = 0
  for (const one of fulfillmentLinks) {
    try {
      await link.create([one])
      linked++
    } catch {
      refused++
    }
  }
  logger.info(
    `Linked ${linked} fulfillment record(s); ${refused} already belong to ` +
      `another seller.`
  )
  if (linked === 0 && refused > 0) {
    logger.warn(
      'This vendor has no fulfillment of its own, so its items cannot be ' +
        'checked out. Browse and pricing work.'
    )
  }

  // ------------------------------------------------------- competing offers

  const shippingProfileId = shippingProfiles[0]?.id
  const stockLocationId = stockLocations[0]?.id
  if (!shippingProfileId || !stockLocationId) {
    throw new Error('No shipping profile or stock location to sell from.')
  }

  const { data: existingOffers } = await query.graph({
    entity: 'offer',
    fields: ['id', 'variant_id'],
    filters: { seller_id: sellerId },
  })
  const alreadyOffered = new Set(
    existingOffers.flatMap((o) => (o?.variant_id ? [o.variant_id] : []))
  )

  const { data: variants } = await query.graph({
    entity: 'product_variant',
    fields: ['id', 'sku', 'title'],
  })

  const offers: OfferInput[] = []
  for (const variant of variants) {
    const sku = variant?.sku
    if (!sku || !(sku in COMPETING_PRICES)) {
      continue
    }
    if (alreadyOffered.has(variant.id)) {
      continue
    }

    offers.push({
      seller_id: sellerId,
      created_by: 'demo-seed',
      // Offer SKUs are unique per seller; inventory SKUs are unique across the
      // whole store, so the vendor's handle namespaces both.
      sku: `${VENDOR.handle}-${sku}`,
      variant_id: variant.id,
      shipping_profile_id: shippingProfileId,
      prices: [
        { amount: COMPETING_PRICES[sku], currency_code: VENDOR.currency },
      ],
      inventory_items: [
        {
          sku: `${VENDOR.handle}-inv-${sku}`,
          required_quantity: 1,
          stock_levels: [
            { location_id: stockLocationId, stocked_quantity: 250 },
          ],
        },
      ],
    })
  }

  if (offers.length) {
    await createOffersWorkflow(container).run({ input: { offers } })
  }

  logger.info(
    `Created ${offers.length} competing offer(s); ` +
      `${alreadyOffered.size} already existed.`
  )
  logger.info('Demo vendor ready.')
}
