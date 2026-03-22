import { findSubscriberByEmail, createSubscriber } from "../newsletter.server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Shopify-Shop-Domain",
};

async function parseBody(request) {
  const contentType = request.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) {
      const text = await request.text();
      if (!text || text.trim() === "") return {};
      return JSON.parse(text);
    }
    if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const formData = await request.formData();
      return Object.fromEntries(formData.entries());
    }
    const text = await request.text();
    if (!text || text.trim() === "") return {};
    try {
      return JSON.parse(text);
    } catch {
      const params = new URLSearchParams(text);
      return Object.fromEntries(params.entries());
    }
  } catch (err) {
    console.error("parseBody error:", err);
    return {};
  }
}

export async function loader({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
  return new Response(
    JSON.stringify({ status: "ok", message: "Newsletter endpoint is available" }),
    {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    }
  );
}

export async function action({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  console.log("=== SUBSCRIBE REQUEST ===");
  console.log("Method:", request.method);
  console.log("Content-Type:", request.headers.get("content-type"));

  const payload = await parseBody(request);
  console.log("Payload:", JSON.stringify(payload));

  const email = (payload.email || "").trim().toLowerCase();
  const firstName = (payload.firstName || payload.first_name || "").trim();
  const lastName = (payload.lastName || payload.last_name || "").trim();
  const shop = (
    payload.shop ||
    request.headers.get("x-shopify-shop-domain") ||
    ""
  ).trim();

  console.log("Email:", email);

  if (!email) {
    console.log("ERROR: email missing");
    return new Response(
      JSON.stringify({ status: "error", message: "Email is required" }),
      {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const existing = await findSubscriberByEmail(email);
    if (existing) {
      console.log("Already subscribed:", email);
      return new Response(
        JSON.stringify({
          status: "already_subscribed",
          message: "You've already subscribed, thank you!",
          subscriber: existing,
        }),
        {
          status: 200,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    const subscriber = await createSubscriber({
      email,
      firstName,
      lastName,
      shop: shop || "unknown",
    });

    console.log("New subscriber created:", email);
    return new Response(
      JSON.stringify({
        status: "subscribed",
        message: "You've been subscribed successfully, thank you!",
        subscriber,
      }),
      {
        status: 201,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Subscribe error:", err);
    return new Response(
      JSON.stringify({ status: "error", message: "Something went wrong, please try again." }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  }
}