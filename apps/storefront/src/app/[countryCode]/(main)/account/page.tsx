import { Metadata } from "next"

import { retrieveCustomer } from "@lib/data/customer"
import { listOrders } from "@lib/data/orders"
import Overview from "@modules/account/components/overview"
import LoginTemplate from "@modules/account/templates/login-template"

export const metadata: Metadata = {
  title: "Account",
  description: "Sign in to your Sokozi account, or view your account activity.",
}

// This page replaces what used to be two parallel route slots, @dashboard and
// @login. Next names a slot's static chunks after its folder, producing URLs
// containing an @, and Azure App Service answers 404 for any path segment that
// starts with one. The chunk was built and present in the image, and the
// container served it happily on localhost; only the request through Azure
// failed. The page therefore rendered on a full load and broke the moment
// anyone clicked a link to it, since only client navigation needs the chunk.
//
// Choosing between the two views here costs one branch and keeps the route free
// of anything a host has to special-case.
export default async function Account() {
  const customer = await retrieveCustomer().catch(() => null)

  if (!customer) {
    return <LoginTemplate />
  }

  const orders = (await listOrders().catch(() => null)) || null

  return <Overview customer={customer} orders={orders} />
}
