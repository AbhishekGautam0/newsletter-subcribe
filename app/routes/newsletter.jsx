import { findSubscriberByEmail, createSubscriber } from "../newsletter.server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Shopify-Shop-Domain",
};

async function parseBody(request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return request.json();
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const formData = await request.formData();
    return Object.fromEntries(formData.entries());
  }

  return {};
}

export async function loader({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  return new Response(
    JSON.stringify({ status: "ok", message: "Newsletter endpoint is available" }),
    {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json",
      },
    },
  );
}

export async function action({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const payload = await parseBody(request);
  const email = (payload.email || "").trim().toLowerCase();
  const firstName = (payload.firstName || payload.first_name || "").trim();
  const lastName = (payload.lastName || payload.last_name || "").trim();
  const shop =
    (payload.shop || request.headers.get("x-shopify-shop-domain") || "").trim();

  if (!email) {
    return new Response(
      JSON.stringify({ status: "error", message: "Email is required" }),
      {
        status: 400,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "application/json",
        },
      },
    );
  }

  const existing = await findSubscriberByEmail(email);
  if (existing) {
    return new Response(
      JSON.stringify({ status: "already_subscribed", message: "Already subscribed", subscriber: existing }),
      {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "application/json",
        },
      },
    );
  }

  const subscriber = await createSubscriber({ email, firstName, lastName, shop: shop || "unknown" });

  return new Response(
    JSON.stringify({ status: "subscribed", message: "Subscription successful", subscriber }),
    {
      status: 201,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json",
      },
    },
  );
}
