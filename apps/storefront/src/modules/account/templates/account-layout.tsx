import React from "react"

import { whatsappNumber } from "@lib/util/whatsapp"

import AccountNav from "../components/account-nav"
import { HttpTypes } from "@medusajs/types"

interface AccountLayoutProps {
  customer: HttpTypes.StoreCustomer | null
  children: React.ReactNode
}

const AccountLayout: React.FC<AccountLayoutProps> = ({
  customer,
  children,
}) => {
  return (
    <div className="flex-1 small:py-12" data-testid="account-page">
      <div className="flex-1 content-container h-full max-w-5xl mx-auto bg-white flex flex-col">
        <div className="grid grid-cols-1  small:grid-cols-[240px_1fr] py-12">
          <div>{customer && <AccountNav customer={customer} />}</div>
          <div className="flex-1">{children}</div>
        </div>
        {/* This linked to /customer-service, a page that does not exist. Next
            prefetches links in view, so the dead route was fetched and 404ed on
            every visit to the account area, and anyone clicking it landed on an
            error page. WhatsApp is the support channel this store actually has,
            and the whole block is dropped when no number is configured rather
            than offering help that goes nowhere. */}
        {whatsappNumber && (
          <div className="flex flex-col small:flex-row items-end justify-between small:border-t border-gray-200 py-12 gap-8">
            <div>
              <h3 className="text-xl-semi mb-4">Got questions?</h3>
              <span className="txt-medium">
                Message us on WhatsApp and we will help you out.
              </span>
            </div>
            <div>
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
                data-testid="account-whatsapp-link"
              >
                Chat on WhatsApp
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AccountLayout
