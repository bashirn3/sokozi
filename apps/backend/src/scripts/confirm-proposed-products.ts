import { ExecArgs } from '@medusajs/framework/types'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { confirmProductsWorkflow } from '@mercurjs/core/workflows'

/**
 * Publish every vendor product waiting for review.
 *
 * The catalogue is shared, so vendors do not mutate it directly. A product a
 * vendor creates enters as `proposed`, visible only to them, and an operator
 * confirms it into the shared catalogue — Mercur's change pipeline, which
 * doubles as the product's audit trail. `/store/products` serves only
 * `published`, so until someone confirms it the vendor sees a product they
 * made, priced and stocked, that no customer can find.
 *
 * Reviewing is meant to happen in Mercur's operator panel, which is not
 * enabled here. This is that button, until it is.
 *
 * Run with:  npx medusa exec ./src/scripts/confirm-proposed-products.ts
 */
export default async function confirmProposedProducts({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: products } = await query.graph({
    entity: 'product',
    fields: ['id', 'title', 'status'],
    filters: { status: 'proposed' },
  })

  if (!products.length) {
    logger.info('Nothing waiting — no products are in `proposed`.')
    return
  }

  await confirmProductsWorkflow(container).run({
    input: {
      product_ids: products.flatMap((p) => (p?.id ? [p.id] : [])),
      internal_note: 'Confirmed in bulk while the operator panel is disabled.',
    },
  })

  for (const product of products) {
    logger.info(`Published "${product.title}".`)
  }
  logger.info(`Confirmed ${products.length} product(s).`)
}
