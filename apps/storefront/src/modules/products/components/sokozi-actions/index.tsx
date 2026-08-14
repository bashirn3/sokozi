"use client"

type SokoziActionsProps = {
  productTitle: string
  priceLabel: string
}

const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "255700000000"

const SokoziActions = ({ productTitle, priceLabel }: SokoziActionsProps) => {
  const message = encodeURIComponent(
    `Hi Sokozi, I want to order: ${productTitle} (${priceLabel})`
  )
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`

  return (
    <div className="flex flex-col gap-3 mt-2">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        className="label inline-flex items-center justify-center rounded border border-ink bg-paper py-3.5 text-ink transition-colors hover:bg-ink hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        Order on WhatsApp
      </a>
      <p className="body text-ink-muted">
        In stock in Dar es Salaam &middot; Delivery 1-24 hours
      </p>
    </div>
  )
}

export default SokoziActions
