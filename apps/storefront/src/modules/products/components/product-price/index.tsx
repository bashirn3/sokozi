import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import PriceBlock from "../price-block"

export default function ProductPrice({
  product,
  variant,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
}) {
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: variant?.id,
  })

  const selectedPrice = variant ? variantPrice : cheapestPrice

  if (!selectedPrice) {
    return <div className="block w-32 h-9 bg-gray-100 animate-pulse" />
  }

  return (
    <div className="flex flex-col gap-1">
      <PriceBlock
        amount={selectedPrice.calculated_price_number}
        currencyCode={selectedPrice.currency_code}
        prefix={!variant ? "From" : undefined}
        testId="product-price"
      />
      {selectedPrice.price_type === "sale" && (
        <p className="label text-ink-muted">
          <span>Original: </span>
          <span
            className="line-through"
            data-testid="original-product-price"
            data-value={selectedPrice.original_price_number}
          >
            {selectedPrice.original_price}
          </span>
          <span className="ml-2">-{selectedPrice.percentage_diff}%</span>
        </p>
      )}
    </div>
  )
}
