/**
 * The hero's backdrop: an original geometric field built from the Tanzanian
 * flag's own construction.
 *
 * The flag is not four colours in a box. It is a black band running corner to
 * corner, fringed in gold, separating green above from blue below. That
 * diagonal is the whole identity, so it is the only device used here — a
 * repeating set of parallel bands at the flag's angle, thinned and spaced so
 * it reads as texture behind type rather than as a flag draped over the page.
 *
 * Drawn rather than sourced. The reference for this idea was a stock
 * illustration, which is licensed and cannot ship, and a photograph would have
 * been the wrong medium anyway. As SVG it costs about a kilobyte, stays sharp
 * at any width, and is genuinely ours.
 *
 * Decorative only: aria-hidden, and it sits behind content at low opacity so
 * the headline keeps its contrast.
 */
const FlagField = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    className="pointer-events-none absolute inset-0 h-full w-full"
    preserveAspectRatio="xMidYMid slice"
    viewBox="0 0 1200 600"
  >
    <defs>
      {/*
        One tile carrying the flag's stack in miniature: green, gold hairline,
        black band, gold hairline, blue. Rotated to the flag's own diagonal.
        The tile repeats, so the whole field is four rectangles and a rotation.
      */}
      <pattern
        id="tz-diagonal"
        width="120"
        height="120"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(-38)"
      >
        <rect width="120" height="120" fill="var(--pitch)" />
        <rect y="0" width="120" height="34" fill="var(--tz-green)" />
        <rect y="34" width="120" height="4" fill="var(--marigold)" />
        <rect y="38" width="120" height="30" fill="var(--pitch)" />
        <rect y="68" width="120" height="4" fill="var(--marigold)" />
        <rect y="72" width="120" height="34" fill="var(--tz-blue)" />
      </pattern>

      {/*
        The field is strongest at the top-right corner the diagonal runs from
        and clears the lower-left entirely, so the headline and button sit on
        flat near-black rather than competing with the pattern.
      */}
      <linearGradient id="tz-fade" x1="1" y1="0" x2="0.15" y2="1">
        <stop offset="0%" stopColor="white" stopOpacity="0.5" />
        <stop offset="45%" stopColor="white" stopOpacity="0.16" />
        <stop offset="100%" stopColor="white" stopOpacity="0" />
      </linearGradient>
      <mask id="tz-mask">
        <rect width="1200" height="600" fill="url(#tz-fade)" />
      </mask>
    </defs>

    <rect width="1200" height="600" fill="url(#tz-diagonal)" mask="url(#tz-mask)" />
  </svg>
)

export default FlagField
