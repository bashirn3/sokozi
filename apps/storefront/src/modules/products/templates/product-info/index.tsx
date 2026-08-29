import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { listOfferSellers } from "@lib/data/sellers"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = async ({ product }: ProductInfoProps) => {
  // Several vendors can list this same product, and the price shown is the
  // cheapest of them. Naming the seller is what makes that a marketplace
  // rather than an unexplained price.
  const sellers = await listOfferSellers()
  const offerId = (
    product.variants?.[0] as { offer_id?: string | null } | undefined
  )?.offer_id
  const seller = offerId ? sellers[offerId] : undefined

  return (
    <div id="product-info">
      <div className="flex flex-col gap-y-4 lg:max-w-[500px] mx-auto">
        {product.collection && (
          <LocalizedClientLink
            href={`/collections/${product.collection.handle}`}
            className="text-medium text-ui-fg-muted hover:text-ui-fg-subtle"
          >
            {product.collection.title}
          </LocalizedClientLink>
        )}
        <Heading
          level="h2"
          className="text-3xl leading-10 text-ui-fg-base"
          data-testid="product-title"
        >
          {product.title}
        </Heading>

        {seller && (
          <Text
            className="text-base-regular text-ui-fg-subtle"
            data-testid="product-seller"
          >
            Sold by <span className="font-semibold">{seller.name}</span>
          </Text>
        )}

        <Text
          className="text-medium text-ui-fg-subtle whitespace-pre-line"
          data-testid="product-description"
        >
          {product.description}
        </Text>
      </div>
    </div>
  )
}

export default ProductInfo
