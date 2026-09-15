export type PromotionTheme = "deals" | "tech" | "fashion" | "weekend" | "home";

export type Promotion = {
  id: number;
  eyebrow: string;
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  image: string;
  theme: PromotionTheme;
};

export const promotions: Promotion[] = [
  {
    id: 1,
    eyebrow: "Limited Time Offer",
    title: "Big Deals. Better Prices.",
    description: "Discover amazing products at prices you don't want to miss.",
    buttonText: "Shop Now",
    buttonLink: "/shop",
    image: "/promotions/big-deals.jpg",
    theme: "deals",
  },

  {
    id: 2,
    eyebrow: "New Arrivals",
    title: "Upgrade Your Tech.",
    description: "Explore the latest smartphones, laptops and accessories.",
    buttonText: "Explore Tech",
    buttonLink: "/shop?category=electronics",
    image: "/promotions/new-tech.jpg",
    theme: "tech",
  },

  {
    id: 3,
    eyebrow: "Fashion Sale",
    title: "Style For Less.",
    description:
      "Refresh your wardrobe with amazing deals on fashion and accessories.",
    buttonText: "Shop Fashion",
    buttonLink: "/shop?category=fashion",
    image: "/promotions/fashion-sale.jpg",
    theme: "fashion",
  },

  {
    id: 4,
    eyebrow: "Weekend Special",
    title: "Save More This Weekend.",
    description: "Enjoy limited-time discounts across selected products.",
    buttonText: "View Deals",
    buttonLink: "/deals",
    image: "/promotions/weekend-special.jpg",
    theme: "weekend",
  },

  {
    id: 5,
    eyebrow: "Home Essentials",
    title: "Make Your Home Better.",
    description:
      "Discover useful products designed to make everyday life easier.",
    buttonText: "Shop Home",
    buttonLink: "/shop?category=home",
    image: "/promotions/home-essentials.jpg",
    theme: "home",
  },
];
