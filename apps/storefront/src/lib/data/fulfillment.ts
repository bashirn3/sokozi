"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { getAuthHeaders, getCacheOptions } from "./cookies"

/**
 * Delivery options for a cart.
 *
 * Mercur returns these grouped by seller — `{ [sellerId]: options[] }` rather
 * than a flat array — because in a marketplace each vendor ships on its own
 * terms and a basket spanning two sellers has two independent delivery
 * decisions to make. Callers here still expect one list, so the groups are
 * flattened.
 *
 * That is honest only while Sokozi is the sole seller. Once a second vendor
 * lists, a flat list silently mixes their options together and lets the
 * customer pick one seller's courier for another seller's parcel. Checkout
 * needs to present a section per seller before that happens; the grouping is
 * preserved on the wire, so the information is there when the UI is ready
 * for it.
 */
export const listCartShippingMethods = async (cartId: string) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("fulfillment")),
  }

  return sdk.client
    .fetch<HttpTypes.StoreShippingOptionListResponse>(
      `/store/shipping-options`,
      {
        method: "GET",
        query: {
          cart_id: cartId,
        },
        headers,
        next,
        cache: "force-cache",
      }
    )
    .then(({ shipping_options }) => {
      if (Array.isArray(shipping_options)) {
        return shipping_options
      }

      return Object.values(
        (shipping_options ?? {}) as Record<
          string,
          HttpTypes.StoreCartShippingOption[]
        >
      ).flat()
    })
    .catch(() => {
      return null
    })
}

export const calculatePriceForShippingOption = async (
  optionId: string,
  cartId: string,
  data?: Record<string, unknown>
) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("fulfillment")),
  }

  const body = { cart_id: cartId, data }

  if (data) {
    body.data = data
  }

  return sdk.client
    .fetch<{ shipping_option: HttpTypes.StoreCartShippingOption }>(
      `/store/shipping-options/${optionId}/calculate`,
      {
        method: "POST",
        body,
        headers,
        next,
      }
    )
    .then(({ shipping_option }) => shipping_option)
    .catch((_e) => {
      return null
    })
}
