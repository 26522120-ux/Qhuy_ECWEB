import { Suspense, lazy } from "react";
import { Toaster } from "react-hot-toast";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { CartProvider } from "./context/CartContext";
import { StoreProvider } from "./context/StoreContext";
import Applayout from "./pages/Applayout";
import Home from "./pages/home";

const LogIn = lazy(() => import("./pages/LogIn"));
const Products = lazy(() => import("./pages/products"));
const ProductPage = lazy(() => import("./pages/productspage"));
const SearchResult = lazy(() => import("./pages/SearchResult"));
const FlashDeals = lazy(() => import("./pages/FlashDeals"));
const MacroCalculator = lazy(() => import("./pages/MacroCalculator"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Cart = lazy(() => import("./pages/Cart"));
const Admin = lazy(() => import("./pages/Admin"));
const MyOrder = lazy(() => import("./pages/Myorder"));
const OrderTracking = lazy(() => import("./pages/OrderTracking"));
const Addresses = lazy(() => import("./pages/Adresses"));

const RouteFallback = () => (
  <div className="flex min-h-[55vh] items-center justify-center bg-[#0b0d0c] px-4 py-16 text-xs font-bold tracking-[0.2em] text-[#b8f927] uppercase">
    Đang tải giao diện nutraGO...
  </div>
);

const App = () => {
  return (
    <StoreProvider>
      <CartProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#111513",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "4px",
              padding: "14px",
            },
          }}
        />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/login" element={<LogIn />} />
            <Route path="/" element={<Applayout />}>
              <Route index element={<Home />} />
              <Route path="products" element={<Products />} />
              <Route path="products/:id" element={<ProductPage />} />
              <Route path="search" element={<SearchResult />} />
              <Route path="deals" element={<FlashDeals />} />
              <Route path="macro" element={<MacroCalculator />} />
              <Route path="cart" element={<Cart />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="admin" element={<Admin />} />
              <Route element={<ProtectedRoute />}>
                <Route path="orders" element={<MyOrder />} />
                <Route path="orders/:id" element={<OrderTracking />} />
                <Route path="addresses" element={<Addresses />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </CartProvider>
    </StoreProvider>
  );
};

export default App;
