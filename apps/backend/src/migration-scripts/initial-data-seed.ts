import { MedusaContainer } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow,
  createCollectionsWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createStoresWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows";

// Category tile imagery, stored on the category so it can be changed from
// admin later without a deploy. The storefront falls back to its own copy of
// this map for databases seeded before these were added.
//
// Every image here is a verified photograph. See the note in
// apps/storefront/src/lib/constants/category-images.ts before changing any.
const SOKOZI_CATEGORY_IMAGES = {
  Electronics:
    "https://images.unsplash.com/photo-1547489401-fcada4966052?w=1200&auto=format&fit=crop",
  Fashion:
    "https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?w=1200&auto=format&fit=crop",
  Home: "https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=1200&auto=format&fit=crop",
  Beauty:
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200&auto=format&fit=crop",
} as const;

const SOKOZI_PRODUCTS = [
  {
    title: "Wireless Earbuds V5",
    handle: "wireless-earbuds-v5",
    category: "Electronics",
    description:
      "Premium wireless earbuds with clear sound and all-day battery. In stock in Dar es Salaam.",
    price: 25000,
    sku: "SOKOZI-EARBUDS",
    image:
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop",
    deal: true,
  },
  {
    title: "Phone Charger",
    handle: "phone-charger",
    category: "Electronics",
    description: "Fast-charging USB cable and adapter bundle for everyday use.",
    price: 10000,
    sku: "SOKOZI-CHARGER",
    image:
      "https://images.unsplash.com/photo-1520287636485-66d0e25add79?w=800&auto=format&fit=crop",
    deal: true,
  },
  {
    title: "Power Bank 10000mAh",
    handle: "power-bank",
    category: "Electronics",
    description: "Reliable portable power bank for phones and small devices.",
    price: 35000,
    sku: "SOKOZI-POWERBANK",
    image:
      "https://images.unsplash.com/photo-1566554738544-d962991c3fee?w=800&auto=format&fit=crop",
  },
  {
    title: "LED Lights Pack",
    handle: "led-lights",
    category: "Electronics",
    description: "Energy-efficient LED lights for home and shop lighting.",
    price: 15000,
    sku: "SOKOZI-LED",
    image:
      "https://images.unsplash.com/photo-1572249930263-64fc5bbdb14b?w=800&auto=format&fit=crop",
    deal: true,
  },
  {
    title: "Classic T-Shirt",
    handle: "classic-t-shirt",
    category: "Fashion",
    description: "Comfortable everyday cotton t-shirt in popular sizes.",
    price: 15000,
    sku: "SOKOZI-TSHIRT",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&auto=format&fit=crop",
  },
  {
    title: "Street Cap",
    handle: "street-cap",
    category: "Fashion",
    description: "Adjustable cap for casual and outdoor wear.",
    price: 10000,
    sku: "SOKOZI-CAP",
    image:
      "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&auto=format&fit=crop",
  },
  {
    title: "Urban Sneakers",
    handle: "urban-sneakers",
    category: "Fashion",
    description: "Lightweight sneakers built for city comfort and style.",
    price: 60000,
    sku: "SOKOZI-SNEAKERS",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop",
  },
  {
    title: "Kitchen Blender",
    handle: "kitchen-blender",
    category: "Home",
    description: "Powerful blender for smoothies, soups, and everyday cooking.",
    price: 45000,
    sku: "SOKOZI-BLENDER",
    image:
      "https://images.unsplash.com/photo-1512203864638-f6cbb3cca374?w=800&auto=format&fit=crop",
  },
  {
    title: "Storage Containers Set",
    handle: "storage-containers",
    category: "Home",
    description: "Durable food and home storage containers in assorted sizes.",
    price: 20000,
    sku: "SOKOZI-CONTAINERS",
    image:
      "https://images.unsplash.com/photo-1621318551436-68573392fd5c?w=800&auto=format&fit=crop",
  },
  {
    title: "Shea Butter Moisturizer",
    handle: "shea-butter-moisturizer",
    category: "Beauty",
    description:
      "Rich shea butter moisturizer for daily skin care. Unscented and gentle enough for everyday use.",
    price: 12000,
    sku: "SOKOZI-SHEA",
    image:
      "https://images.unsplash.com/photo-1606755612769-5655c261e8ce?w=800&auto=format&fit=crop",
    deal: true,
  },
] as const;

export default async function initial_data_seed({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(
    ModuleRegistrationName.FULFILLMENT
  );

  const countries = ["tz"];

  // Guard against a second run.
  //
  // medusa db:migrate records this script in the script_migrations table and
  // will not repeat it, but medusa exec and pnpm backend:seed both bypass that
  // tracking entirely. Without this check a second run duplicates the store,
  // region, sales channel, publishable key and warehouse, then fails on the
  // duplicate product handles, leaving the database in a broken half state.
  const { data: existingStores } = await query.graph({
    entity: "store",
    fields: ["id"],
  });

  if (existingStores.length) {
    logger.info(
      "Sokozi seed skipped: a store already exists. Nothing was changed."
    );
    return;
  }

  logger.info("Seeding Sokozi store data...");
  const {
    result: [defaultSalesChannel],
  } = await createSalesChannelsWorkflow(container).run({
    input: {
      salesChannelsData: [
        {
          name: "Sokozi Store",
          description: "Soko Yako Mkononi — Tanzania mobile store",
        },
      ],
    },
  });

  const {
    result: [publishableApiKey],
  } = await createApiKeysWorkflow(container).run({
    input: {
      api_keys: [
        {
          title: "Sokozi Publishable API Key",
          type: "publishable",
          created_by: "",
        },
      ],
    },
  });

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: publishableApiKey.id,
      add: [defaultSalesChannel.id],
    },
  });

  await createStoresWorkflow(container).run({
    input: {
      stores: [
        {
          name: "Sokozi",
          supported_currencies: [
            {
              currency_code: "tzs",
              is_default: true,
            },
          ],
          default_sales_channel_id: defaultSalesChannel.id,
        },
      ],
    },
  });

  logger.info("Seeding Tanzania region...");
  const { result: regionResult } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "Tanzania",
          currency_code: "tzs",
          countries,
          payment_providers: ["pp_system_default"],
        },
      ],
    },
  });
  const region = regionResult[0];

  await createTaxRegionsWorkflow(container).run({
    input: countries.map((country_code) => ({
      country_code,
      provider_id: "tp_system",
    })),
  });

  logger.info("Seeding Dar es Salaam warehouse...");
  const { result: stockLocationResult } = await createStockLocationsWorkflow(
    container
  ).run({
    input: {
      locations: [
        {
          name: "Dar es Salaam Warehouse",
          address: {
            city: "Dar es Salaam",
            country_code: "TZ",
            address_1: "Sokozi Fulfillment Center",
          },
        },
      ],
    },
  });
  const stockLocation = stockLocationResult[0];

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_provider_id: "manual_manual",
    },
  });

  const { data: shippingProfileResult } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  });
  const shippingProfile = shippingProfileResult[0];

  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: "Tanzania delivery",
    type: "shipping",
    service_zones: [
      {
        name: "Tanzania",
        geo_zones: [
          {
            country_code: "tz",
            type: "country",
          },
        ],
      },
    ],
  });

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_set_id: fulfillmentSet.id,
    },
  });

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "City Delivery",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Standard",
          // No delivery window is stated anywhere. The brief specifies option
          // names and prices only, so a duration here would be invented.
          description: "Flat-rate delivery from our Dar es Salaam warehouse.",
          code: "city-delivery",
        },
        prices: [
          {
            currency_code: "tzs",
            amount: 5000,
          },
          {
            region_id: region.id,
            amount: 5000,
          },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      },
      {
        name: "Same/Next Day Express",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Express",
          // The option name comes from the brief and does imply a timing
          // commitment. The description adds nothing on top of it.
          description: "Priority handling from our Dar es Salaam warehouse.",
          code: "express",
        },
        prices: [
          {
            currency_code: "tzs",
            amount: 8000,
          },
          {
            region_id: region.id,
            amount: 8000,
          },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      },
    ],
  });

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [defaultSalesChannel.id],
    },
  });

  logger.info("Seeding Sokozi categories and products...");
  const { result: categoryResult } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: [
        {
          name: "Electronics",
          is_active: true,
          metadata: { image_url: SOKOZI_CATEGORY_IMAGES.Electronics },
        },
        {
          name: "Fashion",
          is_active: true,
          metadata: { image_url: SOKOZI_CATEGORY_IMAGES.Fashion },
        },
        {
          name: "Home",
          is_active: true,
          metadata: { image_url: SOKOZI_CATEGORY_IMAGES.Home },
        },
        {
          name: "Beauty",
          is_active: true,
          metadata: { image_url: SOKOZI_CATEGORY_IMAGES.Beauty },
        },
      ],
    },
  });

  const categoryByName = Object.fromEntries(
    categoryResult.map((cat) => [cat.name, cat.id])
  );

  const { result: productsResult } = await createProductsWorkflow(container).run({
    input: {
      products: SOKOZI_PRODUCTS.map((product) => ({
        title: product.title,
        category_ids: [categoryByName[product.category]],
        description: product.description,
        handle: product.handle,
        weight: 500,
        status: ProductStatus.PUBLISHED,
        shipping_profile_id: shippingProfile.id,
        images: [{ url: product.image }],
        options: [
          {
            title: "Type",
            values: ["Standard"],
          },
        ],
        variants: [
          {
            title: "Standard",
            sku: product.sku,
            options: {
              Type: "Standard",
            },
            prices: [
              {
                amount: product.price,
                currency_code: "tzs",
              },
            ],
          },
        ],
        sales_channels: [{ id: defaultSalesChannel.id }],
      })),
    },
  });

  const dealProductIds = productsResult
    .filter((product) =>
      SOKOZI_PRODUCTS.some(
        (seed) => seed.handle === product.handle && "deal" in seed && seed.deal
      )
    )
    .map((product) => product.id);

  if (dealProductIds.length) {
    await createCollectionsWorkflow(container).run({
      input: {
        collections: [
          {
            title: "Today's Deals",
            handle: "todays-deals",
            product_ids: dealProductIds,
          },
        ],
      },
    });
  }

  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  });

  await createInventoryLevelsWorkflow(container).run({
    input: {
      inventory_levels: inventoryItems.map((item) => ({
        location_id: stockLocation.id,
        stocked_quantity: 1000,
        inventory_item_id: item.id,
      })),
    },
  });

  logger.info("Sokozi seed completed.");
}
