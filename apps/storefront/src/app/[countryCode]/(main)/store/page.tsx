import { Metadata } from "next"

import { parseOptionValueIds } from "@lib/util/product-option-filters"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"

export const metadata: Metadata = {
  title: "Store",
  description: "Explore all of our products.",
}

type StorePageSearchParams = Record<string, string | string[] | undefined> & {
  sortBy?: SortOptions
  page?: string
  q?: string | string[]
  optionValueIds?: string | string[]
}

type Params = {
  searchParams: Promise<StorePageSearchParams>
  params: Promise<{
    countryCode: string
  }>
}

export default async function StorePage(props: Params) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { sortBy, page, q } = searchParams
  const optionValueIds = parseOptionValueIds(searchParams)

  // A repeated ?q= yields an array. Take the first entry rather than sending
  // a comma joined string to the backend.
  const query = (Array.isArray(q) ? q[0] : q)?.trim() || undefined

  return (
    <StoreTemplate
      sortBy={sortBy}
      page={page}
      q={query}
      countryCode={params.countryCode}
      optionValueIds={optionValueIds}
    />
  )
}
