import db from "./db.server";

export async function findSubscriberByEmail(email) {
  return db.subscriber.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
}

export async function createSubscriber({ email, firstName, lastName, shop }) {
  return db.subscriber.create({
    data: {
      email: email.trim().toLowerCase(),
      firstName: firstName || "",
      lastName: lastName || "",
      shop: shop || "unknown",
    },
  });
}

export async function getSubscribers() {
  return db.subscriber.findMany({
    orderBy: { createdAt: "desc" },
  });
}