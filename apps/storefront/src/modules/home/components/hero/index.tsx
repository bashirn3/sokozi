import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * The hero carried a repeating diagonal pattern in the flag's colours. It was
 * cut: at any size that made it visible it read as decoration applied to a
 * page rather than as the page's own structure, which is exactly the look
 * this store is trying to avoid. Flat near-black with the gold accent does
 * the same job without announcing itself.
 *
 * flag-field.tsx is kept for now in case a single quiet rule is wanted later.
 * A whole field of it is not.
 */
const Hero = () => {
  return (
    <section className="relative w-full overflow-hidden bg-pitch text-on-pitch">
      <div className="content-container relative py-20 small:py-28 flex flex-col items-start gap-5">
        <span className="label text-marigold">Dar es Salaam</span>

        <h1 className="display max-w-[12ch]">Soko Yako Mkononi</h1>

        <p className="body max-w-[44ch] text-on-pitch-muted">
          Your market in your hand. Electronics, fashion, home and beauty,
          priced in shillings and shipped from Dar es Salaam.
        </p>

        <LocalizedClientLink
          href="/store"
          className="label mt-2 bg-marigold px-7 py-4 text-ink transition-colors duration-200 ease-[ease] hover:bg-on-pitch focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marigold"
        >
          Shop all products
        </LocalizedClientLink>
      </div>
    </section>
  )
}

export default Hero
