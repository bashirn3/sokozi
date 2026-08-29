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
 * The price treatment.
 *
 * The currency is set small and quiet beside the number rather than above it.
 * It used to sit on its own line, which read well when the number was large,
 * but the number came down to sit near the rest of the interface and a
 * stranded "TZS" then cost a whole line in every tile of a dense grid.
 *
 * The original intent survives: the number leads, the currency is a label, and
 * in a market where price is the headline it still outweighs the product name
 * beside it — by weight now rather than by size.
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
    <div className={clx("flex items-baseline gap-1.5", className)}>
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
