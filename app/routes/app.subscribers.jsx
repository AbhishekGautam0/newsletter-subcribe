import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getSubscribers } from "../newsletter.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  const subscribers = await getSubscribers();
  return { subscribers };
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

      <s-section heading={`${subscribers.length} total subscribers`}>
        <s-paragraph>
          Customers who submitted the newsletter form from your storefront.
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
                {["Email", "Name", "Shop", "Subscribed at"].map((h) => (
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
                <tr
                  key={s.id}
                  style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}
                >
                  <td style={{ borderTop: "1px solid #eee", padding: "10px" }}>
                    {s.email}
                  </td>
                  <td style={{ borderTop: "1px solid #eee", padding: "10px" }}>
                    {`${s.firstName || ""} ${s.lastName || ""}`.trim() || "—"}
                  </td>
                  <td style={{ borderTop: "1px solid #eee", padding: "10px" }}>
                    {s.shop}
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