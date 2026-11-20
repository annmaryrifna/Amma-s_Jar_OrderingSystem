import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import CustomerDashboard from "./pages/CustomerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLayout from "./layouts/AdminLayout";
import CategoryManagement from "./pages/CategoryManagement";
import ProductManagement from "./pages/ProductManagement"
import AdminOrderManagement from "./pages/AdminOrderManagement";
import Shop from "./pages/Shop";
import Cart from "./pages/Cart"; 
import Checkout from "./pages/Checkout";
import MyOrders from "./pages/MyOrders";
import ProductDelivery from "./pages/ProductDeliveryPlaces";
import AdminPaymentManagement from "./pages/AdminPaymentManagement";
import { CartProvider } from "./context/CartContext";
function App() {
  return (
    <BrowserRouter>
      <CartProvider>
      <Routes>

        {/* Public Pages */}
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/shop" element={<Shop />} />
        
        {/* Customer Dashboard */}
        <Route
          path="/customer/dashboard"
          element={<CustomerDashboard />}
        />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/customer/orders" element={<MyOrders />} />

        {/* Admin Pages */}
        <Route path="/admin" element={<AdminLayout />}>
         <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="places" element={<ProductDelivery />} />
         <Route path="categories" element={<CategoryManagement />} />
          <Route path="products" element={<ProductManagement />} /> 
          <Route path="orders" element={<AdminOrderManagement />} />
            <Route path="payments" element={<AdminPaymentManagement />}
            />
        </Route>

      </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;