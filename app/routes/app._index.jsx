import { useEffect } from "react";
import { useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const color = ["Red", "Orange", "Yellow", "Green"][Math.floor(Math.random() * 4)];
  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id title handle status
            variants(first: 10) { edges { node { id price barcode createdAt } } }
            demoInfo: metafield(namespace: "$app", key: "demo_info") { jsonValue }
          }
        }
      }`,
    { variables: { product: { title: `${color} Snowboard`, metafields: [{ namespace: "$app", key: "demo_info", value: "Created by React Router Template" }] } } }
  );
  const responseJson = await response.json();
  const product = responseJson.data.productCreate.product;
  const variantId = product.variants.edges[0].node.id;
  const variantResponse = await admin.graphql(
    `#graphql
    mutation shopifyReactRouterTemplateUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants { id price barcode createdAt }
      }
    }`,
    { variables: { productId: product.id, variants: [{ id: variantId, price: "100.00" }] } }
  );
  const variantResponseJson = await variantResponse.json();
  const metaobjectResponse = await admin.graphql(
    `#graphql
    mutation shopifyReactRouterTemplateUpsertMetaobject($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
      metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
        metaobject { id handle title: field(key: "title") { jsonValue } description: field(key: "description") { jsonValue } }
        userErrors { field message }
      }
    }`,
    { variables: { handle: { type: "$app:example", handle: "demo-entry" }, metaobject: { fields: [{ key: "title", value: "Demo Entry" }, { key: "description", value: "This metaobject was created by the Shopify app template." }] } } }
  );
  const metaobjectResponseJson = await metaobjectResponse.json();
  return {
    product: responseJson.data.productCreate.product,
    variant: variantResponseJson.data.productVariantsBulkUpdate.productVariants,
    metaobject: metaobjectResponseJson.data.metaobjectUpsert.metaobject,
  };
};

export default function Index() {
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const isLoading = ["loading", "submitting"].includes(fetcher.state) && fetcher.formMethod === "POST";

  useEffect(() => {
    if (fetcher.data?.product?.id) shopify.toast.show("Product created");
  }, [fetcher.data?.product?.id, shopify]);

  const generateProduct = () => fetcher.submit({}, { method: "POST" });

  return (
    <s-page heading="Shopify app template">
      <s-button slot="primary-action" onClick={generateProduct}>
        Generate a product
      </s-button>

      {/* ✅ NEW: Subscribers nav card */}
      <s-section heading="Newsletter Subscribers">
        <s-paragraph>
          View and manage all customers who subscribed via your storefront form.
        </s-paragraph>
        <s-button onClick={() => (window.location.href = "/app/subscribers")}>
          View Subscribers
        </s-button>
      </s-section>

      <s-section heading="Congrats on creating a new Shopify app 🎉">
        <s-paragraph>
          This embedded app template uses App Bridge interface examples like an{" "}
          <s-link href="/app/additional">additional page in the app nav</s-link>.
        </s-paragraph>
      </s-section>

      <s-section heading="Get started with products">
        <s-paragraph>
          Generate a product with GraphQL and get the JSON output for that product.
        </s-paragraph>
        <s-stack direction="inline" gap="base">
          <s-button onClick={generateProduct} {...(isLoading ? { loading: true } : {})}>
            Generate a product
          </s-button>
          {fetcher.data?.product && (
            <s-button
              onClick={() => shopify.intents.invoke?.("edit:shopify/Product", { value: fetcher.data?.product?.id })}
              target="_blank"
              variant="tertiary"
            >
              Edit product
            </s-button>
          )}
        </s-stack>
        {fetcher.data?.product && (
          <s-section heading="productCreate mutation">
            <s-stack direction="block" gap="base">
              <s-box padding="base" borderWidth="base" borderRadius="base" background="subdued">
                <pre style={{ margin: 0 }}><code>{JSON.stringify(fetcher.data.product, null, 2)}</code></pre>
              </s-box>
              <s-heading>productVariantsBulkUpdate mutation</s-heading>
              <s-box padding="base" borderWidth="base" borderRadius="base" background="subdued">
                <pre style={{ margin: 0 }}><code>{JSON.stringify(fetcher.data.variant, null, 2)}</code></pre>
              </s-box>
              <s-heading>metaobjectUpsert mutation</s-heading>
              <s-box padding="base" borderWidth="base" borderRadius="base" background="subdued">
                <pre style={{ margin: 0 }}><code>{JSON.stringify(fetcher.data.metaobject, null, 2)}</code></pre>
              </s-box>
            </s-stack>
          </s-section>
        )}
      </s-section>

      <s-section slot="aside" heading="App template specs">
        <s-paragraph><s-text>Framework: </s-text><s-link href="https://reactrouter.com/" target="_blank">React Router</s-link></s-paragraph>
        <s-paragraph><s-text>Database: </s-text><s-link href="https://www.prisma.io/" target="_blank">Prisma</s-link></s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};