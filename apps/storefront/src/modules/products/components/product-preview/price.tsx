import { VariantPrice } from "types/global"
import PriceBlock from "../price-block"

export default async function PreviewPrice({ price }: { price: VariantPrice }) {
  if (!price) {
    return null
  }

  return (
    <div className="flex flex-col gap-1">
      <PriceBlock
        amount={price.calculated_price_number}
        currencyCode={price.currency_code}
        testId="price"
      />
      {price.price_type === "sale" && (
        <span
          className="label text-ink-muted line-through"
          data-testid="original-price"
        >
          {price.original_price}
        </span>
      )}
    </div>
  )
}
