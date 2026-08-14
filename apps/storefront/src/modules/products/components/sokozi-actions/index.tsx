"use client"

import { whatsappNumber } from "@lib/util/whatsapp"

type SokoziActionsProps = {
  productTitle: string
  priceLabel: string
}

const SokoziActions = ({ productTitle, priceLabel }: SokoziActionsProps) => {
  const message = encodeURIComponent(
    `Hi Sokozi, I want to order: ${productTitle} (${priceLabel})`
  )

  return (
    <div className="mt-2 flex flex-col gap-3">
      {whatsappNumber && (
        <a
          href={`https://wa.me/${whatsappNumber}?text=${message}`}
          target="_blank"
          rel="noreferrer"
          className="label inline-flex items-center justify-center rounded border border-ink bg-paper py-3.5 text-ink transition-colors hover:bg-ink hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          Order on WhatsApp
        </a>
      )}
      <p className="body text-ink-muted">
        In stock in Dar es Salaam &middot; Delivery 1-24 hours
      </p>
    </div>
  )
}

export default SokoziActions
