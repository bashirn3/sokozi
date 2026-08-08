import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const CATEGORY_EMOJI: Record<string, string> = {
  Electronics: "📱",
  Fashion: "👗",
  Home: "🏠",
  Beauty: "💄",
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
    <section className="content-container py-10">
      <h2 className="text-xl font-semibold mb-6">Shop by category</h2>
      <div className="grid grid-cols-2 small:grid-cols-4 gap-4">
        {topLevel.map((category) => (
          <LocalizedClientLink
            key={category.id}
            href={`/categories/${category.handle}`}
            className="rounded-2xl border border-ui-border-base bg-ui-bg-subtle p-6 text-center hover:border-emerald-500 hover:bg-emerald-50 transition-colors"
          >
            <span className="text-3xl block mb-3">
              {CATEGORY_EMOJI[category.name ?? ""] ?? "🛍️"}
            </span>
            <span className="text-sm font-medium text-ui-fg-base">
              {category.name}
            </span>
          </LocalizedClientLink>
        ))}
      </div>
    </section>
  )
}

export default CategoryGrid
