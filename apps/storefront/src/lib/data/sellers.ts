"use server"

import { sdk } from "@lib/config"
import { CATALOGUE_REVALIDATE_SECONDS } from "@lib/constants/cache"

import { getCacheOptions } from "./cookies"

export type OfferSeller = {
  name: string
  handle: string
}

/**
 * Who is selling what.
 *
 * A product page shows one price, but that price belongs to a seller: several
 * vendors can list the same catalogue entry and the storefront quotes the
 * cheapest. Without naming the winner, two vendors competing looks
 * indistinguishable from a price changing on its own.
 *
 * The seller does not travel on the product. `/store/products` computes
 * `variants.calculated_price` and `variants.offer_id` from the winning offer
 * and stops there, so the names are fetched once and looked up by offer id
 * rather than a request per card. Cached on the catalogue's own revalidation
 * window, since sellers change far less often than prices do.
 */
export const listOfferSellers = async (): Promise<
  Record<string, OfferSeller>
> => {
  const next = {
    ...(await getCacheOptions("offers")),
    revalidate: CATALOGUE_REVALIDATE_SECONDS,
  }

  return sdk.client
    .fetch<{
      offers: { id: string; seller?: OfferSeller | null }[]
    }>(`/store/offers`, {
      method: "GET",
      query: { limit: 200 },
      next,
      cache: "force-cache",
    })
    .then(({ offers }) =>
      Object.fromEntries(
        (offers ?? [])
          .filter((o) => o?.id && o.seller?.name)
          .map((o) => [o.id, o.seller as OfferSeller])
      )
    )
    .catch(() => {
      // A storefront that cannot name the seller is worth more than one that
      // will not render, so this degrades to showing no attribution.
      return {}
    })
}
