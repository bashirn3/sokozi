import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { linkProductsToSalesChannelWorkflow } from "@medusajs/medusa/core-flows";

/**
 * Puts every newly created product into the store's default sales channel.
 *
 * Without this, a product created in admin comes out Published with no sales
 * channel attached, which means it looks live in the dashboard and is invisible
 * on the storefront. Nothing warns you: the create form does not require a
 * channel and no error is raised. It is the most common reason a shop owner
 * adds a product and cannot find it.
 *
 * Products that already have a channel are left alone, so this never overrides
 * a deliberate choice and does not interfere with the seed, which assigns the
 * channel itself.
 */
export default async function assignDefaultSalesChannel({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  try {
    const {
      data: [product],
    } = await query.graph({
      entity: "product",
      fields: ["id", "title", "sales_channels.id"],
      filters: { id: data.id },
    });

    if (!product) {
      return;
    }

    // Already assigned, by the seed or by whoever created it. Leave it be.
    if (product.sales_channels?.length) {
      return;
    }

    const {
      data: [store],
    } = await query.graph({
      entity: "store",
      fields: ["id", "default_sales_channel_id"],
    });

    const salesChannelId = store?.default_sales_channel_id;

    if (!salesChannelId) {
      logger.warn(
        `Product ${data.id} has no sales channel and the store has no default set, so it will not appear on the storefront.`
      );
      return;
    }

    await linkProductsToSalesChannelWorkflow(container).run({
      input: { id: salesChannelId, add: [data.id] },
    });

    logger.info(
      `Assigned "${product.title}" to the default sales channel so it can appear on the storefront.`
    );
  } catch (error) {
    // Never let this break product creation. A product without a channel is
    // recoverable from admin; a failed create is not.
    logger.error(
      `Could not assign a default sales channel to product ${data.id}: ${error}`
    );
  }
}

export const config: SubscriberConfig = {
  event: "product.created",
};
