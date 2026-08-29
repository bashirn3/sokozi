"use client"

import { addToCart } from "@lib/data/cart"
import { useIntersection } from "@lib/hooks/use-in-view"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@modules/common/components/ui"
import Divider from "@modules/common/components/divider"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import { isEqual } from "lodash"
import { useParams, usePathname, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import ProductPrice from "../product-price"
import MobileActions from "./mobile-actions"
import SokoziActions from "../sokozi-actions"
import { convertToLocale } from "@lib/util/money"
import { useRouter } from "next/navigation"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt) => {
    if (varopt.option_id) acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

export default function ProductActions({
  product,
  region,
  disabled,
}: ProductActionsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [isAdding, setIsAdding] = useState(false)
  const countryCode = useParams().countryCode as string

  // If there is only 1 variant, preselect the options
  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [product.variants])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // update the options when a variant is selected
  const setOptionValue = (optionId: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }

  //check if the selected options produce a valid variant
  const isValidVariant = useMemo(() => {
    return product.variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const value = isValidVariant ? selectedVariant?.id : null

    if (params.get("v_id") === value) {
      return
    }

    if (value) {
      params.set("v_id", value)
    } else {
      params.delete("v_id")
    }

    router.replace(pathname + "?" + params.toString())
  }, [selectedVariant, isValidVariant])

  // Mercur carries the offer id on the variant, next to the price it computed
  // from that same offer. A variant with no offer_id has no seller listing
  // behind it, so there is nothing to price and nothing to buy.
  const offerId = (selectedVariant as { offer_id?: string | null } | undefined)
    ?.offer_id

  // Whether the selected variant can be bought.
  //
  // Under Mercur stock belongs to the offer, not the variant, so
  // `variants.inventory_quantity` comes back empty even when asked for
  // explicitly — the variant is a catalogue entry that any seller may list.
  // Reading only that field marks the entire catalogue "Out of stock" while
  // every price still renders correctly.
  //
  // Both signals are accepted so this holds against either backend during the
  // deploy: an offer id from Mercur, or an inventory count from vanilla
  // Medusa. Real stock is enforced where it cannot be stale — the cart rejects
  // an over-quantity line with "Some inventory item linked to an offer does
  // not have sufficient stock", so overselling stays impossible. It does mean
  // a sold-out item reads as available until the customer adds it; showing
  // that accurately needs per-offer stock from /store/offers, which is a
  // follow-up rather than part of the cutover.
  const inStock = useMemo(() => {
    if (selectedVariant && !selectedVariant.manage_inventory) {
      return true
    }

    if (selectedVariant?.allow_backorder) {
      return true
    }

    if (offerId) {
      return true
    }

    return (selectedVariant?.inventory_quantity || 0) > 0
  }, [selectedVariant, offerId])

  const actionsRef = useRef<HTMLDivElement>(null)

  const inView = useIntersection(actionsRef, "0px")

  // Add the selected seller's offer to the cart, falling back to the variant
  // so this works against whichever backend is currently deployed.
  const handleAddToCart = async () => {
    if (!offerId && !selectedVariant?.id) return null

    setIsAdding(true)

    await addToCart({
      offerId,
      variantId: selectedVariant?.id,
      quantity: 1,
      countryCode,
    })

    setIsAdding(false)
  }

  return (
    <>
      <div className="flex flex-col gap-y-2" ref={actionsRef}>
        <div>
          {(product.variants?.length ?? 0) > 1 && (
            <div className="flex flex-col gap-y-4">
              {(product.options || []).map((option) => {
                return (
                  <div key={option.id}>
                    <OptionSelect
                      option={option}
                      current={options[option.id]}
                      updateOption={setOptionValue}
                      title={option.title ?? ""}
                      data-testid="product-options"
                      disabled={!!disabled || isAdding}
                    />
                  </div>
                )
              })}
              <Divider />
            </div>
          )}
        </div>

        <ProductPrice product={product} variant={selectedVariant} />

        <Button
          onClick={handleAddToCart}
          disabled={
            !inStock ||
            !selectedVariant ||
            !!disabled ||
            isAdding ||
            !isValidVariant
          }
          variant="primary"
          // Matches the WhatsApp button beside it and the hero's call to
          // action: buttons in this store are uppercase and tracked, the way
          // the reference sets every one of its own.
          className="label w-full h-11"
          isLoading={isAdding}
          data-testid="add-product-button"
        >
          {!selectedVariant && !options
            ? "Select variant"
            : !inStock || !isValidVariant
            ? "Out of stock"
            : "Add to cart"}
        </Button>
        <SokoziActions
          productTitle={product.title ?? "Product"}
          priceLabel={convertToLocale({
            amount:
              selectedVariant?.calculated_price?.calculated_amount ??
              product.variants?.[0]?.calculated_price?.calculated_amount ??
              0,
            currency_code: region.currency_code,
            locale: "en-TZ",
          })}
        />
        <MobileActions
          product={product}
          variant={selectedVariant}
          options={options}
          updateOptions={setOptionValue}
          inStock={inStock}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding}
          show={!inView}
          optionsDisabled={!!disabled || isAdding}
        />
      </div>
    </>
  )
}
