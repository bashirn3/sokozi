// The placeholder that ships in .env.template. Treated the same as unset, so a
// demo can never present a WhatsApp link that reaches nobody.
const PLACEHOLDER_NUMBER = "255700000000"

const configured = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim()

/**
 * The WhatsApp number to order through, or null when none is configured.
 *
 * Null means the WhatsApp action is not rendered at all. Nothing anywhere
 * should advertise WhatsApp ordering while this is null.
 *
 * NEXT_PUBLIC_ variables are inlined at build time, so changing the number
 * requires a rebuild rather than just a restart.
 */
export const whatsappNumber =
  configured && configured !== PLACEHOLDER_NUMBER ? configured : null
