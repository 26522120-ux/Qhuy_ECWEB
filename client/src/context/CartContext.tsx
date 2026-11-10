import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import toast from "react-hot-toast";
import type { CartItem, Product } from "../types";
import { INR_TO_VND } from "../localization";
import { useStore } from "./StoreContext";

const CART_STORAGE_KEY = "instantmart-cart";
const DELIVERY_FEE = 15_000;
const FREE_DELIVERY_THRESHOLD = 300_000;

interface CartTotals {
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  totals: CartTotals;
  addItem: (product: Product, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function isStoredCart(value: unknown): value is Array<{ productId: string; quantity: number }> {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        "productId" in item &&
        typeof item.productId === "string" &&
        "quantity" in item &&
        typeof item.quantity === "number" &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0,
    )
  );
}

function calculateTotals(items: CartItem[], taxRate: number): CartTotals {
  const subtotal = items.reduce(
    (sum, item) => sum + Math.round(item.product.price * INR_TO_VND) * item.quantity,
    0,
  );
  const deliveryFee = subtotal === 0 || subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const tax = Math.round(subtotal * (taxRate / 100));

  return {
    subtotal,
    deliveryFee,
    tax,
    total: subtotal + deliveryFee + tax,
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { products, taxRate } = useStore();
  const [storedItems, setStoredItems] = useState<Array<{ productId: string; quantity: number }>>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const items = useMemo(
    () =>
      storedItems.flatMap(({ productId, quantity }) => {
        const product = products.find((item) => item._id === productId);
        return product ? [{ product, quantity: Math.min(quantity, product.stock) }] : [];
      }),
    [products, storedItems],
  );

  useEffect(() => {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (storedCart) {
      try {
        const parsed: unknown = JSON.parse(storedCart);
        if (!isStoredCart(parsed)) {
          throw new Error("Dữ liệu giỏ hàng không đúng định dạng.");
        }

        setStoredItems(parsed);
      } catch {
        localStorage.removeItem(CART_STORAGE_KEY);
        toast.error("Không thể khôi phục giỏ hàng cũ. Giỏ hàng đã được làm mới.");
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    try {
      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(storedItems),
      );
    } catch {
      toast.error("Không thể lưu giỏ hàng vào trình duyệt.");
    }
  }, [isLoaded, storedItems]);

  const addItem = useCallback((product: Product, quantity = 1) => {
    const currentItem = storedItems.find((item) => item.productId === product._id);
    const nextQuantity = (currentItem?.quantity ?? 0) + quantity;

    if (quantity <= 0 || nextQuantity > product.stock) {
      toast.error(`Chỉ còn ${product.stock} sản phẩm trong kho.`);
      return;
    }

    if (currentItem) {
      setStoredItems((currentItems) =>
        currentItems.map((item) =>
          item.productId === product._id ? { ...item, quantity: nextQuantity } : item,
        ),
      );
    } else {
      setStoredItems((currentItems) => [...currentItems, { productId: product._id, quantity }]);
    }
    toast.success("Đã thêm sản phẩm vào giỏ hàng.");
  }, [storedItems]);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    const item = storedItems.find((cartItem) => cartItem.productId === productId);
    if (!item) return;
    const product = products.find((productItem) => productItem._id === productId);
    if (!product || quantity <= 0) {
      setStoredItems((currentItems) =>
        currentItems.filter((cartItem) => cartItem.productId !== productId),
      );
      return;
    }
    if (quantity > product.stock) {
      toast.error(`Chỉ còn ${product.stock} sản phẩm trong kho.`);
      return;
    }
    setStoredItems((currentItems) =>
      currentItems.map((cartItem) =>
        cartItem.productId === productId ? { ...cartItem, quantity } : cartItem,
      ),
    );
  }, [products, storedItems]);

  const removeItem = useCallback((productId: string) => {
    setStoredItems((currentItems) => currentItems.filter((item) => item.productId !== productId));
  }, []);

  const clearCart = useCallback(() => setStoredItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    return {
      items,
      itemCount,
      totals: calculateTotals(items, taxRate),
      addItem,
      setQuantity,
      removeItem,
      clearCart,
    };
  }, [addItem, clearCart, items, removeItem, setQuantity, taxRate]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart phải được sử dụng bên trong CartProvider.");
  }
  return context;
}
