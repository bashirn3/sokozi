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

  return (
    <LocalizedClientLink href={`/products/${product.handle}`} className="group">
      <div data-testid="product-wrapper">
        <Thumbnail
          thumbnail={product.thumbnail}
          images={product.images}
          size="full"
          isFeatured={isFeatured}
        />
        <div className="mt-4 flex flex-col gap-1">
          {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
          <Text className="body text-ink" data-testid="product-title">
            {product.title}
          </Text>
          {seller && (
            <Text
              className="text-xsmall-regular text-ink/60"
              data-testid="product-seller"
            >
              Sold by {seller.name}
            </Text>
          )}
        </div>
      </div>
    </LocalizedClientLink>
  )
}
