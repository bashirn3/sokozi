import { HttpTypes } from "@medusajs/types"
import { clx } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Written out in full rather than composed, so Tailwind's content scanner
// sees each class.
const CATEGORY_COLOR: Record<string, string> = {
  Electronics: "bg-cat-electronics",
  Fashion: "bg-cat-fashion",
  Home: "bg-cat-home",
  Beauty: "bg-cat-beauty",
}

type CategoryGridProps = {
  categories: HttpTypes.StoreProductCategory[]
}

const CategoryGrid = ({ categories }: CategoryGridProps) => {
  const topLevel = categories.filter((category) => !category.parent_category)

  if (!topLevel.length) {
    return null
  }

  return (
    <section className="content-container py-12">
      <h2 className="heading mb-6">Shop by category</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {topLevel.map((category) => (
          <LocalizedClientLink
            key={category.id}
            href={`/categories/${category.handle}`}
            className={clx(
              "flex aspect-[4/3] items-end rounded p-5 text-paper transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
              CATEGORY_COLOR[category.name ?? ""] ?? "bg-ink"
            )}
          >
            <span className="heading">{category.name}</span>
          </LocalizedClientLink>
        ))}
      </div>
    </section>
  )
}

export default CategoryGrid
