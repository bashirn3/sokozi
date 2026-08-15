"use client"

import { useParams, useRouter } from "next/navigation"
import { useState } from "react"

type SearchBarProps = {
  defaultValue?: string
}

const SearchBar = ({ defaultValue = "" }: SearchBarProps) => {
  const router = useRouter()
  const params = useParams()
  const [query, setQuery] = useState(defaultValue)

  // Keep the region prefix on the URL. Pushing a bare /store would still work
  // through a middleware redirect, but that is an extra round trip per search.
  const countryCode = (params?.countryCode as string) ?? ""
  const basePath = countryCode ? `/${countryCode}/store` : "/store"

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = query.trim()
    router.push(
      trimmed ? `${basePath}?q=${encodeURIComponent(trimmed)}` : basePath
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full" role="search">
      <label htmlFor="sokozi-search" className="sr-only">
        Search products
      </label>
      <div className="flex gap-2">
        <input
          id="sokozi-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search products"
          className="body w-full rounded border border-hairline bg-paper px-4 py-3 text-ink placeholder:text-ink-muted"
        />
        <button
          type="submit"
          className="label rounded bg-ink px-5 text-paper transition-colors hover:bg-ink-muted"
        >
          Search
        </button>
      </div>
    </form>
  )
}

export default SearchBar
