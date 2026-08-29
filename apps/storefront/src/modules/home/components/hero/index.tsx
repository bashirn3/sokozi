import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * The hero.
 *
 * Flat near-black for now, deliberately. Two things have been tried and cut:
 * a repeating diagonal in the flag's colours, which read as decoration applied
 * to a page rather than as the page's own structure, and a documentary
 * photograph of Kariakoo market, which was a genuine picture of the right
 * subject but the wrong kind of picture — a street scene where the store needs
 * a product shot.
 *
 * When there is a photograph worth putting here, it goes behind this content
 * with a left-weighted scrim so the type keeps its contrast. Until then flat
 * is honest and does not pretend.
 */
const Hero = () => {
  return (
    <section className="relative w-full overflow-hidden bg-pitch text-on-pitch">
      <div className="content-container relative py-20 small:py-28 flex flex-col items-start gap-5">
        <span className="label text-marigold">Dar es Salaam</span>

        <h1 className="display max-w-[12ch]">Soko Yako Mkononi</h1>

        <p className="body max-w-[42ch] text-on-pitch/85">
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
