import { Text } from "@modules/common/components/ui"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { listOfferSellers } from "@lib/data/sellers"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"

export default async function ProductPreview({
  product,
  isFeatured,
  region: _region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  // The price on this card belongs to whichever seller is currently cheapest,
  // so the card says who that is. The lookup is one cached request shared by
  // every card on the page, not one per card.
  const sellers = await listOfferSellers()
  const offerId = (
    product.variants?.[0] as { offer_id?: string | null } | undefined
  )?.offer_id
  const seller = offerId ? sellers[offerId] : undefined
  // const pricedProduct = await listProducts({
  //   regionId: region.id,
  //   queryParams: { id: [product.id!] },
  // }).then(({ response }) => response.products[0])

  // if (!pricedProduct) {
  //   return null
  // }

  const { cheapestPrice } = getProductPrice({
    product,
  })

  // A second photograph, where the product has one, is what the image swaps to
  // on hover. Fashion retail does this with a crossfade rather than a zoom:
  // the picture changes, the tile does not move. Scaling a card on hover is
  // the tell of a generated storefront, so there is none here.
  const alternate = product.images?.find(
    (image) => image.url && image.url !== product.thumbnail
  )

  return (
    <LocalizedClientLink href={`/products/${product.handle}`} className="group">
      <div data-testid="product-wrapper">
        <div className="relative overflow-hidden bg-paper-shade">
          <Thumbnail
            thumbnail={product.thumbnail}
            images={product.images}
            size="full"
            isFeatured={isFeatured}
          />
          {alternate?.url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={alternate.url}
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-200 ease-[ease] group-hover:opacity-100"
            />
          )}
        </div>

        {/* Name, then price, then who is selling it — the order the eye needs
            after the photograph has done its job. */}
        <div className="mt-3 flex flex-col gap-1">
          <Text className="body text-ink" data-testid="product-title">
            {product.title}
          </Text>
          {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
          {seller && (
            <Text
              // Truncated rather than wrapped: a two-line seller name pushes
              // one tile taller than its neighbour and the grid stops looking
              // like a grid.
              className="price-label truncate text-ink-muted"
              data-testid="product-seller"
            >
              {seller.name}
            </Text>
          )}
        </div>
      </div>
    </LocalizedClientLink>
  )
}
