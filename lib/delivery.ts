export const deliveryOptions = [
  {
    id: "free",
    name: "Free Delivery",
    description: "Delivery within 7–14 business days",
    price: 0,
    minDays: 3,
    maxDays: 5,
  },
  {
    id: "standard",
    name: "Standard Delivery",
    description: "Delivery within 3–5 business days",
    price: 2000,
    minDays: 2,
    maxDays: 3,
  },
  {
    id: "express",
    name: "Express Delivery",
    description: "Delivery within 1–2 business days",
    price: 5000,
    minDays: 1,
    maxDays: 1,
  },
] as const;

export type DeliveryMethod = (typeof deliveryOptions)[number]["id"];
