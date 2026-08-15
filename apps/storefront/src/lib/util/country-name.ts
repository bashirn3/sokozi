/**
 * Shortens the ISO country names Medusa returns into what people actually say.
 *
 * The backend's `display_name` for Tanzania is "Tanzania, United Republic of",
 * which is correct ISO 3166 and wrong for a shop. The same pattern affects
 * "Korea, Republic of", "Moldova, Republic of" and similar, so the general rule
 * is to keep the part before the first comma.
 */
export const shortCountryName = (displayName?: string | null): string => {
  if (!displayName) {
    return ""
  }
  const [head] = displayName.split(",")
  return head.trim() || displayName
}
