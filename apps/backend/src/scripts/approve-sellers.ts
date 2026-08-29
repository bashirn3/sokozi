import { ExecArgs } from '@medusajs/framework/types'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { approveSellerWorkflow } from '@mercurjs/core/workflows'

/**
 * Approve every seller waiting on it.
 *
 * A seller that registers through the vendor portal lands in
 * `pending_approval`, and Mercur withholds an unapproved seller's offers from
 * the storefront. That is the right default for a real marketplace — an
 * operator vets who gets to sell — but while testing it looks like the vendor
 * did everything correctly and nothing appeared.
 *
 * This is the operator's side of that gate, for use until the approval screen
 * in Mercur's admin panel is wired up.
 *
 * Run with:  npx medusa exec ./src/scripts/approve-sellers.ts
 */
export default async function approveSellers({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: sellers } = await query.graph({
    entity: 'seller',
    fields: ['id', 'name', 'handle', 'status'],
  })

  const waiting = sellers.filter((s) => s?.status !== 'open')

  if (!waiting.length) {
    logger.info(`Nothing to approve — all ${sellers.length} seller(s) are open.`)
    return
  }

  for (const seller of waiting) {
    await approveSellerWorkflow(container).run({
      input: { seller_id: seller.id },
    })
    logger.info(`Approved "${seller.name}" (${seller.handle}).`)
  }

  logger.info(`Approved ${waiting.length} seller(s).`)
}
