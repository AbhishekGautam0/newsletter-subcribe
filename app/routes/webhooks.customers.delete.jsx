import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  const { topic, payload } = await authenticate.webhook(request);

  if (topic === "CUSTOMERS_DELETE") {
    const email = payload?.email;
    if (email) {
      try {
        await db.subscriber.deleteMany({
          where: { email: email.trim().toLowerCase() },
        });
        console.log("Deleted subscriber:", email);
      } catch (err) {
        console.error("Failed to delete subscriber:", err);
      }
    }
  }

  return new Response(null, { status: 200 });
};