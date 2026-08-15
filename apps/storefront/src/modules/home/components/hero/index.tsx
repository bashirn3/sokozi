import LocalizedClientLink from "@modules/common/components/localized-client-link"

const Hero = () => {
  return (
    <section className="w-full bg-ink text-paper">
      <div className="content-container py-16 small:py-24 flex flex-col items-start gap-6">
        <h1 className="display max-w-[12ch]">Soko Yako Mkononi</h1>
        <p className="body max-w-[46ch] text-paper-shade">
          Your market in your hand. Electronics, fashion, home and beauty,
          priced in shillings and shipped from Dar es Salaam.
        </p>
        <LocalizedClientLink
          href="/store"
          className="label rounded bg-marigold px-6 py-4 text-ink transition-colors hover:bg-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
        >
          Shop all products
        </LocalizedClientLink>
      </div>
    </section>
  )
}

export default Hero
