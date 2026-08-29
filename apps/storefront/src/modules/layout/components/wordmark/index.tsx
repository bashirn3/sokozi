import { clx } from "@modules/common/components/ui"

/**
 * The Sokozi wordmark, lettered in the Tanzanian flag.
 *
 * The six letters run the flag's sequence twice: green, gold, black, blue,
 * then green and gold again to close. Reading the flag left to right in the
 * name keeps it recognisably the flag rather than six arbitrary colours.
 *
 * The values are the deepened palette tokens rather than the flag's own
 * broadcast values. At full saturation the green and blue glare against warm
 * paper and the mark reads as a sticker; deepened, the letters hold together
 * as one word. Tracking is a touch wider than the label default so each letter
 * is read as its own shape instead of the whole thing turning into stripes.
 *
 * The mark carries the store's name, so it is spelled out for assistive
 * technology and the coloured letters are hidden from it.
 */

const LETTERS = [
  { char: "S", light: "var(--tz-green)", dark: "var(--tz-green)" },
  { char: "O", light: "var(--marigold-deep)", dark: "var(--marigold)" },
  // Black disappears on a dark header, so on pitch this letter takes the
  // paper colour: the flag's black band is a division rather than a hue, and
  // on a black ground the division has to be drawn in light.
  { char: "K", light: "var(--pitch)", dark: "var(--on-pitch)" },
  { char: "O", light: "var(--tz-blue)", dark: "var(--tz-blue)" },
  { char: "Z", light: "var(--tz-green)", dark: "var(--tz-green)" },
  { char: "I", light: "var(--marigold-deep)", dark: "var(--marigold)" },
]

const Wordmark = ({
  className,
  onPitch = false,
}: {
  className?: string
  onPitch?: boolean
}) => (
  <span
    className={clx(
      // Sized to carry the header rather than sit politely inside it, and set
      // light rather than bold. The label default is 700, which at this size
      // turns the mark into a slab; Jost's geometry is what should be doing
      // the work, and it only shows at a weight that lets the counters open
      // up. Tracking tightens as the size grows, since the wide spacing that
      // kept the small mark legible starts to pull the word apart.
      "label inline-flex items-baseline text-2xl font-normal leading-none tracking-[0.08em] small:text-3xl",
      className
    )}
  >
    <span className="sr-only">Sokozi</span>
    {LETTERS.map((letter, i) => (
      <span
        key={`${letter.char}-${i}`}
        aria-hidden="true"
        style={{ color: onPitch ? letter.dark : letter.light }}
      >
        {letter.char}
      </span>
    ))}
  </span>
)

export default Wordmark
