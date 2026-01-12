import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { addCartItem, getCart, removeCartItem } from "@/services/cart.service";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated, hasRole } = useAuth();
  const isStudent = isAuthenticated && hasRole("ROLE_STUDENT");
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshCart = useCallback(async () => {
    if (!isStudent) {
      setCart(null);
      return null;
    }
    setLoading(true);
    setError("");
    try {
      const data = await getCart();
      setCart(data);
      return data;
    } catch (err) {
      setError(err?.message || "Không thể tải giỏ hàng.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [isStudent]);

  const addToCart = useCallback(
    async (courseId) => {
      if (!isStudent) {
        throw new Error("Vui lòng đăng nhập bằng tài khoản học viên.");
      }
      const data = await addCartItem(courseId);
      setCart(data);
      return data;
    },
    [isStudent]
  );

  const removeItem = useCallback(
    async (itemId) => {
      if (!isStudent) return;
      await removeCartItem(itemId);
      await refreshCart();
    },
    [isStudent, refreshCart]
  );

  useEffect(() => {
    if (isStudent) {
      refreshCart();
    } else {
      setCart(null);
    }
  }, [isStudent, refreshCart]);

  const itemCount = cart?.items?.length || 0;

  const value = useMemo(
    () => ({
      cart,
      loading,
      error,
      itemCount,
      refreshCart,
      addToCart,
      removeItem,
    }),
    [cart, loading, error, itemCount, refreshCart, addToCart, removeItem]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
