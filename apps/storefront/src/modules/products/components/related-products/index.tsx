import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { HttpTypes } from "@medusajs/types"
import Product from "../product-preview"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

export default async function RelatedProducts({
  product,
  countryCode,
}: RelatedProductsProps) {
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  // Category first, collection only as a fallback. Every Sokozi product sits in
  // the Today's Deals collection, so matching on collection returned the entire
  // catalogue: a product page listed all nine other products under a heading
  // calling them related. Category is the narrower signal and the one a shopper
  // would recognise as related.
  const categoryIds = product.categories?.map((c) => c.id).filter(Boolean) ?? []

  const queryParams: HttpTypes.StoreProductListParams = { is_giftcard: false }
  if (region?.id) {
    queryParams.region_id = region.id
  }
  if (categoryIds.length) {
    queryParams.category_id = categoryIds as string[]
  } else if (product.collection_id) {
    queryParams.collection_id = [product.collection_id]
  }

  const RELATED_LIMIT = 4

  const products = await listProducts({
    queryParams,
    countryCode,
  }).then(({ response }) =>
    response.products
      .filter((responseProduct) => responseProduct.id !== product.id)
      .slice(0, RELATED_LIMIT)
  )

  if (!products.length) {
    return null
  }

  return (
    <div className="product-page-constraint">
      {/* Was a centred two-line block whose sentence wrapped to three lines on a
          phone and said nothing the eyebrow above it had not. One heading, left
          aligned like every other section. */}
      <h2 className="heading mb-8">More like this</h2>

      <ul className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8">
        {products.map((product) => (
          <li key={product.id}>
            <Product region={region} product={product} />
          </li>
        ))}
      </ul>
    </div>
  )
}
