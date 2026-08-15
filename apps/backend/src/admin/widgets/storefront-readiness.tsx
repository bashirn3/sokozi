import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { DetailWidgetProps, HttpTypes } from "@medusajs/framework/types";
import { Badge, Container, Heading, Text } from "@medusajs/ui";

/**
 * Tells the shop owner whether a product will actually show up on the
 * storefront, and what is missing if it will not.
 *
 * Four conditions have to hold. Three of them fail silently: a product with no
 * sales channel, no TZS price, or no category looks perfectly fine in this
 * dashboard and simply never appears to a customer.
 */

type Check = {
  label: string;
  ok: boolean | null;
  hint: string;
};

const STORE_CURRENCY = "tzs";

const buildChecks = (product: HttpTypes.AdminProduct): Check[] => {
  const salesChannels = product.sales_channels;
  const variants = product.variants;
  const categories = product.categories;

  const hasPrice = variants?.some((variant) =>
    variant.prices?.some(
      (price) => price.currency_code?.toLowerCase() === STORE_CURRENCY
    )
  );

  return [
    {
      label: "Published",
      ok: product.status === "published",
      hint: "Draft products are never shown to customers.",
    },
    {
      label: "In a sales channel",
      // Undefined means the relation was not loaded, which is not the same as
      // empty. Saying "missing" then would be a lie.
      ok: salesChannels === undefined ? null : salesChannels.length > 0,
      hint: "New products are added to Sokozi Store automatically.",
    },
    {
      label: "Has a price in TZS",
      ok: variants === undefined ? null : Boolean(hasPrice),
      hint: "A variant needs a TZS price or the product cannot be bought.",
    },
    {
      label: "In a category",
      ok: categories === undefined ? null : categories.length > 0,
      hint: "Without one it only appears in the full store listing, not under a category.",
    },
  ];
};

const StorefrontReadinessWidget = ({
  data,
}: DetailWidgetProps<HttpTypes.AdminProduct>) => {
  const checks = buildChecks(data);
  const blocking = checks.filter((check) => check.ok === false);
  const unknown = checks.some((check) => check.ok === null);

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Storefront readiness</Heading>
        {blocking.length === 0 ? (
          <Badge color={unknown ? "grey" : "green"} size="2xsmall">
            {unknown ? "Cannot tell" : "Visible to customers"}
          </Badge>
        ) : (
          <Badge color="orange" size="2xsmall">
            {blocking.length} to fix
          </Badge>
        )}
      </div>

      <div className="flex flex-col gap-y-3 px-6 py-4">
        {checks.map((check) => (
          <div key={check.label} className="flex items-start justify-between gap-x-4">
            <div className="flex flex-col">
              <Text size="small" weight="plus">
                {check.label}
              </Text>
              {check.ok !== true && (
                <Text size="small" className="text-ui-fg-subtle">
                  {check.hint}
                </Text>
              )}
            </div>
            <Badge
              size="2xsmall"
              color={
                check.ok === true ? "green" : check.ok === false ? "orange" : "grey"
              }
            >
              {check.ok === true ? "Ready" : check.ok === false ? "Missing" : "Unknown"}
            </Badge>
          </div>
        ))}
      </div>

      {blocking.length > 0 && (
        <div className="px-6 py-4">
          <Text size="small" className="text-ui-fg-subtle">
            Customers will not see this product until the items marked Missing are
            resolved. Nothing else warns you about this.
          </Text>
        </div>
      )}
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details",
});

export default StorefrontReadinessWidget;
