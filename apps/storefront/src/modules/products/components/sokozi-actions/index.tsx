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
        className="inline-flex items-center justify-center rounded-md border border-emerald-600 bg-emerald-50 text-emerald-800 text-sm font-medium py-2.5 hover:bg-emerald-100 transition-colors"
      >
        Order on WhatsApp
      </a>
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-md border border-ui-border-base bg-ui-bg-base text-sm font-medium py-2.5 hover:bg-ui-bg-subtle transition-colors"
        onClick={() =>
          alert(
            "M-Pesa checkout will be connected here. For now, use Add to Cart or WhatsApp."
          )
        }
      >
        Pay via M-Pesa
      </button>
      <p className="text-xs text-ui-fg-muted">
        ✓ In stock in Dar es Salaam · 🚚 Delivery: 1–24 hours
      </p>
    </div>
  )
}

export default SokoziActions
