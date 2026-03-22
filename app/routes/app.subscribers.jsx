import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getSubscribers, deleteSubscriberByEmail } from "../newsletter.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  // Get all subscribers from our DB
  const dbSubscribers = await getSubscribers();

  if (dbSubscribers.length === 0) {
    return { subscribers: [] };
  }

  // Check each subscriber still exists in Shopify
  const verifiedSubscribers = [];

  for (const sub of dbSubscribers) {
    const res = await admin.graphql(`
      query findCustomer($query: String!) {
        customers(first: 1, query: $query) {
          edges {
            node {
              id
              email
              firstName
              lastName
              emailMarketingConsent {
                marketingState
              }
            }
          }
        }
      }
    `, { variables: { query: `email:${sub.email}` } });

    const data = await res.json();
    const found = data.data.customers.edges;

    if (found.length === 0) {
      // Customer deleted from Shopify — remove from our DB too
      await deleteSubscriberByEmail(sub.email);
      console.log("Synced: removed deleted customer", sub.email);
    } else {
      // Customer exists — add Shopify data to the record
      verifiedSubscribers.push({
        ...sub,
        shopifyId: found[0].node.id,
        marketingState: found[0].node.emailMarketingConsent?.marketingState,
      });
    }
  }

  return { subscribers: verifiedSubscribers };
};

export default function SubscribersAdmin() {
  const { subscribers } = useLoaderData();

  return (
    <s-page heading="Newsletter Subscribers">
      <s-button
        slot="primary-action"
        variant="tertiary"
        onClick={() => (window.location.href = "/app")}
      >
        Back to home
      </s-button>

      <s-section heading={`${subscribers.length} active subscribers`}>
        <s-paragraph>
          Customers who subscribed via your storefront form and still exist in your Shopify store.
        </s-paragraph>
      </s-section>

      <s-section>
        {subscribers.length === 0 ? (
          <s-paragraph>
            No subscribers yet. Add the subscribe form block to your storefront theme.
          </s-paragraph>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ background: "#f6f6f7" }}>
                {["Email", "Name", "Shop", "Marketing Status", "Subscribed at"].map((h) => (
                  <th
                    key={h}
                    style={{
                      borderBottom: "1px solid #ddd",
                      textAlign: "left",
                      padding: "10px",
                      fontWeight: 600,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s, i) => (
                <tr key={s.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ borderTop: "1px solid #eee", padding: "10px" }}>{s.email}</td>
                  <td style={{ borderTop: "1px solid #eee", padding: "10px" }}>
                    {`${s.firstName || ""} ${s.lastName || ""}`.trim() || "—"}
                  </td>
                  <td style={{ borderTop: "1px solid #eee", padding: "10px" }}>{s.shop}</td>
                  <td style={{ borderTop: "1px solid #eee", padding: "10px" }}>
                    <span style={{
                      background: s.marketingState === "SUBSCRIBED" ? "#d4edda" : "#fff3cd",
                      color: s.marketingState === "SUBSCRIBED" ? "#155724" : "#856404",
                      padding: "2px 10px",
                      borderRadius: "12px",
                      fontSize: "0.78rem",
                      fontWeight: 500,
                    }}>
                      {s.marketingState || "UNKNOWN"}
                    </span>
                  </td>
                  <td style={{ borderTop: "1px solid #eee", padding: "10px" }}>
                    {new Date(s.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};