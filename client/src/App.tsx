import { Toaster } from "react-hot-toast";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { CartProvider } from "./context/CartContext";
import { StoreProvider } from "./context/StoreContext";
import LogIn from "./pages/LogIn";
import Applayout from "./pages/Applayout";
import Home from "./pages/home";
import Products from "./pages/products";
import ProductPage from "./pages/productspage";
import SearchResult from "./pages/SearchResult";
import FlashDeals from "./pages/FlashDeals";
import Checkout from "./pages/Checkout";
import Cart from "./pages/Cart";
import Admin from "./pages/Admin";
import MyOrder from "./pages/Myorder";
import OrderTracking from "./pages/OrderTracking";
import Addresses from "./pages/Adresses";
import MacroCalculator from "./pages/MacroCalculator";

const App = () => {
  return (
    <StoreProvider>
      <CartProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#333",
              color: "#fff",
              borderRadius: "12px",
              padding: "14px",
            },
          }}
        />
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
      </CartProvider>
    </StoreProvider>
  );
};

export default App;
