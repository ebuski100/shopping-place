"use client";

import { useEffect } from "react";

import { useProductRatingsStore } from "@/lib/store/productRatingsStore";

export default function ProductRatingsLoader() {
  const loadRatings = useProductRatingsStore((state) => state.loadRatings);

  useEffect(() => {
    loadRatings();
  }, [loadRatings]);

  return null;
}
