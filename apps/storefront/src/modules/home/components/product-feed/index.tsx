import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PriceBlock from "@modules/products/components/price-block"
import Image from "next/image"

type ProductFeedProps = {
  region: HttpTypes.StoreRegion
}

const ProductFeed = async ({ region }: ProductFeedProps) => {
  const {
    response: { products },
  } = await listProducts({
    regionId: region.id,
    queryParams: {
      limit: 12,
      fields: "*variants.calculated_price,+thumbnail",
    },
  })

  if (!products?.length) {
    return null
  }

  return (
    <section className="py-12">
      <div className="content-container mb-6">
        <h2 className="heading">Discover on Sokozi</h2>
        <p className="body mt-1 text-ink-muted">
          Scroll trending products and order in seconds
        </p>
      </div>
      {/* px-6 matches content-container, so this row starts on the same line as
          every other section. scroll-px-6 is what actually makes that hold:
          snap-mandatory snaps to a card's edge, which scrolls the container by
          exactly the padding and leaves the first card flush against the
          viewport at 0. Scroll padding moves the snap position instead, so the
          card lands at 24px like the headings above it. */}
      <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 scroll-px-6 pb-4">
        {products.map((product) => {
          const price =
            product.variants?.[0]?.calculated_price?.calculated_amount ?? 0

          return (
            <article
              key={product.id}
              className="flex min-w-[260px] max-w-[260px] flex-shrink-0 snap-start flex-col overflow-hidden rounded border border-hairline bg-paper"
            >
              <div className="relative aspect-[9/12] bg-paper-shade">
                {product.thumbnail ? (
                  <Image
                    src={product.thumbnail}
                    alt={product.title ?? "Product"}
                    fill
                    className="object-cover"
                    sizes="260px"
                  />
                ) : (
                  <div className="body absolute inset-0 flex items-center justify-center text-ink-muted">
                    No image
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <PriceBlock
                  amount={price}
                  currencyCode={region.currency_code}
                />
                <h3 className="body line-clamp-2 flex-1 text-ink">
                  {product.title}
                </h3>
                <LocalizedClientLink
                  href={`/products/${product.handle}`}
                  className="label rounded bg-ink px-4 py-3 text-center text-paper transition-colors hover:bg-ink-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  View product
                </LocalizedClientLink>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default ProductFeed
