import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import { convertToLocale } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
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
    <section className="py-10">
      <div className="content-container mb-6">
        <h2 className="text-xl font-semibold">Discover on Sokozi</h2>
        <p className="text-sm text-ui-fg-subtle mt-1">
          Scroll trending products — order in seconds
        </p>
      </div>
      <div className="flex gap-4 overflow-x-auto px-4 small:px-8 pb-4 snap-x snap-mandatory scrollbar-hide">
        {products.map((product) => {
          const price =
            product.variants?.[0]?.calculated_price?.calculated_amount ?? 0

          return (
            <article
              key={product.id}
              className="min-w-[260px] max-w-[260px] snap-start rounded-2xl overflow-hidden border border-ui-border-base bg-black text-white flex-shrink-0"
            >
              <div className="relative aspect-[9/12] bg-ui-bg-subtle">
                {product.thumbnail ? (
                  <Image
                    src={product.thumbnail}
                    alt={product.title ?? "Product"}
                    fill
                    className="object-cover"
                    sizes="260px"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-ui-fg-muted">
                    No image
                  </div>
                )}
              </div>
              <div className="p-4 flex flex-col gap-3">
                <h3 className="font-medium line-clamp-2">{product.title}</h3>
                <p className="text-emerald-300 font-semibold">
                  {convertToLocale({
                    amount: price,
                    currency_code: region.currency_code,
                    locale: "en-TZ",
                  })}
                </p>
                <LocalizedClientLink
                  href={`/products/${product.handle}`}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-500 text-white text-sm font-medium py-2.5 hover:bg-emerald-400 transition-colors"
                >
                  Order Now
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
