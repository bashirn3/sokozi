import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { Archivo } from "next/font/google"
import "styles/globals.css"

// One custom face, display only. Body text uses the system stack so nothing
// extra is downloaded for it, which matters on the mobile connections this
// store is built for.
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-archivo",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light" className={archivo.variable}>
      <body className="bg-paper text-ink">
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
