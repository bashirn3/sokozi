import Image from "next/image"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * The hero: a geometric pattern, held well back.
 *
 * This is the fourth thing tried here and the first that works. A generated
 * diagonal field read as decoration applied to a page. A documentary
 * photograph of Kariakoo market was the right subject in the wrong register.
 * An aerial of the city had no focal point and, darkened enough to carry type,
 * became wallpaper.
 *
 * The pattern works because it is artwork rather than a picture of something:
 * it has no subject to be lost, it is already dark, and it survives being
 * pushed back to a texture. Its palette is pan-African — green, gold, red,
 * cream — rather than strictly the Tanzanian flag, which has blue and no red.
 * The washes mute the red enough that it reads as one family with the gold
 * accent rather than as a second, competing story.
 */
const Hero = () => {
  return (
    <section className="relative w-full overflow-hidden bg-pitch text-on-pitch">
      <Image
        src="/hero-pattern.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      {/* Two even washes, stacked.
          The second layer used to be weighted to the left so the headline sat
          on solid ground, and that is what produced a dark band down one side
          on a wide screen — a shape that followed nothing in the artwork and
          read as a fault. Both layers are uniform now: the pattern comes down
          to a texture the type can sit on anywhere in the frame, and there is
          no edge for the eye to catch on. */}
      <div aria-hidden="true" className="absolute inset-0 bg-pitch/55" />
      <div aria-hidden="true" className="absolute inset-0 bg-pitch/45" />

      {/* Sized against the viewport rather than by padding, so the photograph
          gets room to be a photograph. A hero that ends before the fold reads
          as a banner; one that fills most of the screen reads as an entrance. */}
      <div className="content-container relative flex min-h-[62vh] flex-col items-start justify-center gap-5 py-20 small:min-h-[72vh] small:py-28">
        <span className="label text-marigold-deep">Dar es Salaam</span>

        <h1 className="display max-w-[12ch]">Soko Yako Mkononi</h1>

        <p className="body max-w-[42ch] text-on-pitch/85">
          Your market in your hand. Electronics, fashion, home and beauty,
          priced in shillings and shipped from Dar es Salaam.
        </p>

        <LocalizedClientLink
          href="/store"
          className="label mt-2 bg-marigold-deep px-7 py-4 text-ink transition-colors duration-200 ease-[ease] hover:bg-on-pitch focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marigold-deep"
        >
          Shop all products
        </LocalizedClientLink>
      </div>
    </section>
  )
}

export default Hero
