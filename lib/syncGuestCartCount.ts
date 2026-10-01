import { getGuestCartQuantity } from "@/lib/guestCart";
import { useStoreCounts } from "@/lib/store/useStoreCounts";

export function syncGuestCartCount() {
  const count = getGuestCartQuantity();

  useStoreCounts.getState().setCartCount(count);

  return count;
}
