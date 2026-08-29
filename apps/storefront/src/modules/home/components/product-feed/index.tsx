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
            // No border, no per-card button. The tile is the link and the
            // photograph is the tile; chrome around each product is what makes
            // a row read as a widget rather than a rail of merchandise.
            <LocalizedClientLink
              key={product.id}
              href={`/products/${product.handle}`}
              className="group min-w-[280px] max-w-[280px] flex-shrink-0 snap-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <article className="flex flex-col">
                <div className="relative aspect-[3/4] overflow-hidden bg-paper-shade">
                  {product.thumbnail ? (
                    <Image
                      src={product.thumbnail}
                      alt={product.title ?? "Product"}
                      fill
                      className="object-cover transition-opacity duration-200 ease-[ease] group-hover:opacity-90"
                      sizes="280px"
                    />
                  ) : (
                    <div className="body absolute inset-0 flex items-center justify-center text-ink-muted">
                      No image
                    </div>
                  )}
                </div>
                <div className="mt-3 flex flex-col gap-1">
                  <h3 className="body line-clamp-2 text-ink">
                    {product.title}
                  </h3>
                  <PriceBlock
                    amount={price}
                    currencyCode={region.currency_code}
                  />
                </div>
              </article>
            </LocalizedClientLink>
          )
        })}
      </div>
    </section>
  )
}

export default ProductFeed
