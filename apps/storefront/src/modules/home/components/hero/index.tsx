import LocalizedClientLink from "@modules/common/components/localized-client-link"

import FlagField from "./flag-field"

const Hero = () => {
  return (
    <section className="relative w-full overflow-hidden bg-pitch text-on-pitch">
      <FlagField />

      {/* The content sits above the field. The pattern is masked away from the
          lower left, so this column lands on flat near-black. */}
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
