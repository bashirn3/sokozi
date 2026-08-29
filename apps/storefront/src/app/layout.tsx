import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { Jost } from "next/font/google"
import "styles/globals.css"

// Jost, a geometric sans in the Futura lineage.
//
// Chosen by measurement rather than taste: the fashion retail look this store
// is aiming at is carried almost entirely by Futura PT, which is licensed
// through Adobe and cannot ship here. Jost is the closest freely available
// face in that lineage, and the geometry is what does the work — circular
// bowls, a single-storey a, generous counters.
//
// Regular is included alongside the heavy weights because the reference sets
// most of its interface at 400 and rations bold; loading only the heavy cuts
// would force the design into the shouty look it is trying to avoid.
const jost = Jost({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jost",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light" className={jost.variable}>
      <body className="bg-paper text-ink">
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
