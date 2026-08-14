"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

const SearchBar = () => {
  const router = useRouter()
  const [query, setQuery] = useState("")

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = query.trim()
    if (trimmed) {
      router.push(`/store?q=${encodeURIComponent(trimmed)}`)
      return
    }
    router.push("/store")
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <label htmlFor="sokozi-search" className="sr-only">
        Search products
      </label>
      <input
        id="sokozi-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search products..."
        className="w-full rounded border border-ui-border-base bg-white px-5 py-3 text-sm text-ui-fg-base placeholder:text-ui-fg-muted focus:outline-none focus:ring-2 focus:ring-ink"
      />
    </form>
  )
}

export default SearchBar
