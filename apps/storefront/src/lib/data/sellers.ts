"use server"

import { sdk } from "@lib/config"
import { CATALOGUE_REVALIDATE_SECONDS } from "@lib/constants/cache"

import { getCacheOptions } from "./cookies"

export type OfferSeller = {
  name: string
  handle: string
}

export type VariantOffer = {
  id: string
  variantId: string
  seller: OfferSeller
  amount: number
  currencyCode: string
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

/**
 * Every seller's offer on a given variant, cheapest first.
 *
 * A product page quotes one price, and that price belongs to whichever seller
 * is currently cheapest. Without this the losing offers are invisible: a
 * shopper sees "Sold by Kariakoo Traders, TZS 23,000" and has no way of
 * knowing Sokozi lists the same item at 25,000. That is a shop with extra
 * steps, not a marketplace — the whole point of several vendors carrying one
 * catalogue entry is that a buyer can see the choice being made for them.
 *
 * Fetched from the same cached listing the attribution uses, so showing the
 * competition costs no extra request.
 */
export const listOffersForVariant = async (
  variantId?: string | null
): Promise<VariantOffer[]> => {
  if (!variantId) {
    return []
  }

  const next = {
    ...(await getCacheOptions("offers")),
    revalidate: CATALOGUE_REVALIDATE_SECONDS,
  }

  return sdk.client
    .fetch<{
      offers: {
        id: string
        variant_id: string
        seller?: OfferSeller | null
        prices?: { amount: number; currency_code: string }[] | null
      }[]
    }>(`/store/offers`, {
      method: "GET",
      query: { limit: 200 },
      next,
      cache: "force-cache",
    })
    .then(({ offers }) =>
      (offers ?? [])
        .filter((o) => o?.variant_id === variantId && o.seller?.name)
        .flatMap((o) => {
          const price = (o.prices ?? [])[0]
          if (!price || price.amount == null) {
            return []
          }
          return [
            {
              id: o.id,
              variantId: o.variant_id,
              seller: o.seller as OfferSeller,
              amount: price.amount,
              currencyCode: price.currency_code,
            },
          ]
        })
        .sort((a, b) => a.amount - b.amount)
    )
    .catch(() => {
      // Losing the competition list must not cost the page. The winning
      // offer's price and seller are rendered from the product itself.
      return []
    })
}
