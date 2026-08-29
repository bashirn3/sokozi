import Image from "next/image"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * The hero: Dar es Salaam from the air, held well back.
 *
 * The photograph is bright and busy corner to corner — harbour, high rises,
 * roofs — so it is treated as ground rather than as subject. Two layers do
 * that: a flat wash that takes the whole picture down, and a gradient weighted
 * to the left so the type sits on the darkest part while the harbour stays
 * readable on the right.
 *
 * The image is also desaturated slightly. At full strength the water competes
 * with the gold accent, and two loud things in a hero means neither leads.
 */
const Hero = () => {
  return (
    <section className="relative w-full overflow-hidden bg-pitch text-on-pitch">
      <Image
        src="/hero.jpg"
        alt="Aerial view of Dar es Salaam, its harbour and city centre"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center saturate-[0.85]"
      />

      {/* Two washes, and the numbers matter: they stack, so each is gentler
          than it looks. A flat layer takes the whole picture down enough that
          the city stops competing, and a left-weighted gradient then puts the
          type on near-solid ground. Pushed further the photograph turns into a
          dark smudge and there is no reason to carry the image at all. */}
      <div aria-hidden="true" className="absolute inset-0 bg-pitch/45" />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-pitch via-pitch/55 to-pitch/15"
      />

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
