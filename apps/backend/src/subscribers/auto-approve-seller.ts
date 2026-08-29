import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { approveSellerWorkflow } from '@mercurjs/core/workflows'

/**
 * Approve a seller the moment it registers.
 *
 * Mercur holds a new seller at `pending_approval` on the assumption that an
 * operator vets who gets to sell. That is the right default for a marketplace
 * at scale, and the wrong one for Sokozi today: there is no approval screen —
 * Mercur's operator panel is not enabled here — so a vendor who signs up sits
 * in a queue nobody is watching, and the only way through is an operator
 * running a script.
 *
 * Vetting is a policy decision rather than a technical one. When Sokozi wants
 * to vet vendors, delete this file and approve them from the operator panel;
 * nothing else depends on it. Until then, self-service means self-service.
 *
 * Gated on SELLER_AUTO_APPROVE so the behaviour can be turned off in an
 * environment without a code change. Absent, it defaults to on, because a
 * store with no approval screen and no auto-approval has no way to onboard
 * anyone at all.
 */
export default async function autoApproveSeller({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  if (process.env.SELLER_AUTO_APPROVE === 'false') {
    return
  }

  // The workflow emits an array of { id } for a batch, and Medusa delivers each
  // one, so guard against a shape that has already been unwrapped.
  const sellerId = Array.isArray(event.data)
    ? (event.data[0] as { id: string })?.id
    : event.data?.id

  if (!sellerId) {
    return
  }

  try {
    await approveSellerWorkflow(container).run({
      input: { seller_id: sellerId },
    })
    logger.info(`Seller ${sellerId} approved automatically on registration.`)
  } catch (error) {
    // A seller that is already open makes the workflow's validation step
    // throw, which is not worth failing the event over.
    logger.warn(
      `Could not auto-approve seller ${sellerId}: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
}

export const config: SubscriberConfig = {
  event: 'seller.created',
}
