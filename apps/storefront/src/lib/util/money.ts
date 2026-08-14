import { isEmpty } from "./isEmpty"

type ConvertToLocaleParams = {
  amount: number
  currency_code: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  locale?: string
}

const isTzs = (currency_code?: string) =>
  currency_code?.toLowerCase() === "tzs"

const resolveFormatter = ({
  currency_code,
  minimumFractionDigits,
  maximumFractionDigits,
  locale = "en-US",
}: Omit<ConvertToLocaleParams, "amount">) => {
  const tzs = isTzs(currency_code)

  // en-US has no formatting rules for TZS, so fall back to en-TZ.
  const resolvedLocale = locale === "en-US" && tzs ? "en-TZ" : locale

  // Tanzanian shillings are not quoted with cents. Both bounds have to be set
  // together: leaving the minimum at the currency default of 2 while forcing
  // the maximum to 0 makes Intl throw a RangeError.
  const fractionDigits = tzs
    ? {
        minimumFractionDigits: minimumFractionDigits ?? 0,
        maximumFractionDigits: maximumFractionDigits ?? 0,
      }
    : { minimumFractionDigits, maximumFractionDigits }

  return new Intl.NumberFormat(resolvedLocale, {
    style: "currency",
    currency: currency_code,
    ...fractionDigits,
  })
}

export const convertToLocale = ({
  amount,
  currency_code,
  minimumFractionDigits,
  maximumFractionDigits,
  locale = "en-US",
}: ConvertToLocaleParams) => {
  return currency_code && !isEmpty(currency_code)
    ? resolveFormatter({
        currency_code,
        minimumFractionDigits,
        maximumFractionDigits,
        locale,
      }).format(amount)
    : amount.toString()
}

/**
 * Same formatting as convertToLocale, but with the currency symbol split from
 * the number so the two can be set at different sizes.
 *
 * The price treatment on product cards renders the number larger than the
 * product name, with the currency as a small label above it.
 */
export const convertToLocaleParts = ({
  amount,
  currency_code,
  minimumFractionDigits,
  maximumFractionDigits,
  locale = "en-US",
}: ConvertToLocaleParams): { currency: string; amount: string } => {
  if (!currency_code || isEmpty(currency_code)) {
    return { currency: "", amount: amount.toString() }
  }

  const parts = resolveFormatter({
    currency_code,
    minimumFractionDigits,
    maximumFractionDigits,
    locale,
  }).formatToParts(amount)

  return {
    currency: parts
      .filter((part) => part.type === "currency")
      .map((part) => part.value)
      .join(""),
    // Drop literals as well as the currency, so the separator between the
    // symbol and the number does not come along with it.
    amount: parts
      .filter((part) => part.type !== "currency" && part.type !== "literal")
      .map((part) => part.value)
      .join(""),
  }
}
