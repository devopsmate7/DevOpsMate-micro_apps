import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "./api";
import { useAuth } from "./auth";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { token } = useAuth();
  const [cart, setCart] = useState({ items: [], item_count: 0, subtotal_inr: 0 });
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!token) {
      setCart({ items: [], item_count: 0, subtotal_inr: 0 });
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch("/api/commerce/cart", { token });
      setCart(data);
    } catch {
      setCart({ items: [], item_count: 0, subtotal_inr: 0 });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      cart,
      loading,
      refresh,
      async add(courseId) {
        if (!token) throw new Error("Please login to add courses");
        const data = await apiFetch("/api/commerce/cart/items", {
          token,
          method: "POST",
          body: { course_id: courseId, qty: 1 },
        });
        setCart(data);
        return data;
      },
      async remove(courseId) {
        const data = await apiFetch(`/api/commerce/cart/items/${courseId}`, {
          token,
          method: "DELETE",
        });
        setCart(data);
        return data;
      },
      async checkout(body) {
        const order = await apiFetch("/api/commerce/checkout", {
          token,
          method: "POST",
          body,
        });
        await refresh();
        return order;
      },
    }),
    [cart, loading, refresh, token]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
