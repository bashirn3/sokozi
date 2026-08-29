import { convertToLocale } from "@lib/util/money"
import { listOffersForVariant } from "@lib/data/sellers"

/**
 * The other vendors carrying this product.
 *
 * A marketplace only reads as one if the shopper can see the choice being made
 * for them. The page quotes the cheapest offer and names its seller; this
 * shows who else stocks the same item and what they are asking, so the price
 * on the page is visibly a winning bid rather than simply the price.
 *
 * Renders nothing when only one vendor carries the product, which is most of
 * the catalogue today — a heading over a single row would imply competition
 * that is not there.
 */
const OtherSellers = async ({
  variantId,
  winningOfferId,
}: {
  variantId?: string | null
  winningOfferId?: string | null
}) => {
  const offers = await listOffersForVariant(variantId)

  if (offers.length < 2) {
    return null
  }

  const others = offers.filter((offer) => offer.id !== winningOfferId)

  if (!others.length) {
    return null
  }

  return (
    <div className="border-t border-hairline pt-4" data-testid="other-sellers">
      <h3 className="label mb-3 text-ink-muted">
        Also available from {others.length}{" "}
        {others.length === 1 ? "seller" : "sellers"}
      </h3>
      <ul className="flex flex-col gap-2">
        {others.map((offer) => (
          <li
            key={offer.id}
            className="flex items-baseline justify-between gap-4"
            data-testid="other-seller-row"
          >
            <span className="body text-ink">{offer.seller.name}</span>
            <span className="body tabular-nums text-ink-muted">
              {convertToLocale({
                amount: offer.amount,
                currency_code: offer.currencyCode,
              })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default OtherSellers
