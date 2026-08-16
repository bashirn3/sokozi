import { getCategoryImage } from "@lib/constants/category-images"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"

// Written out in full rather than composed, so Tailwind's content scanner
// sees each class. Used as the ground behind the image, and as the whole tile
// for any category without one.
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
        {topLevel.map((category) => {
          const image = getCategoryImage(category.handle, category.metadata)

          return (
            <LocalizedClientLink
              key={category.id}
              href={`/categories/${category.handle}`}
              className={clx(
                "group relative flex aspect-[4/3] items-end overflow-hidden rounded p-5 text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
                CATEGORY_COLOR[category.name ?? ""] ?? "bg-ink"
              )}
            >
              {image && (
                <Image
                  src={image}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              )}
              {/* A flat 45% wash was not enough: over the bright kitchen and the
                  pale cosmetics shots, Home and Beauty were close to
                  unreadable. A gradient that is heaviest where the label sits
                  darkens the bottom without flattening the whole photograph. */}
              <span
                className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/50 to-ink/20"
                aria-hidden="true"
              />
              <span className="heading relative drop-shadow-sm">
                {category.name}
              </span>
            </LocalizedClientLink>
          )
        })}
      </div>
    </section>
  )
}

export default CategoryGrid
