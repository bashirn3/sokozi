import { convertToLocaleParts } from "@lib/util/money"
import { clx } from "@modules/common/components/ui"

type PriceBlockProps = {
  amount: number
  currencyCode: string
  /** Rendered before the currency on the label line, e.g. "From". */
  prefix?: string
  className?: string
  testId?: string
}

/**
 * The signature price treatment.
 *
 * Currency sits above the number as a small label, and the number is set in
 * the display face at a size that outweighs the product name beside it. In a
 * market the price is the headline, so it is the loudest thing on the card.
 */
const PriceBlock = ({
  amount,
  currencyCode,
  prefix,
  className,
  testId,
}: PriceBlockProps) => {
  const { currency, amount: formatted } = convertToLocaleParts({
    amount,
    currency_code: currencyCode,
  })

  return (
    <div className={clx("flex flex-col gap-1", className)}>
      <span className="price-label text-ink-muted">
        {prefix ? `${prefix} ${currency}` : currency}
      </span>
      <span className="price text-ink" data-testid={testId} data-value={amount}>
        {formatted}
      </span>
    </div>
  )
}

export default PriceBlock
