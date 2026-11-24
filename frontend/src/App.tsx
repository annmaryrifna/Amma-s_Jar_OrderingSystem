import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import CustomerDashboard from "./pages/CustomerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLayout from "./layouts/AdminLayout";
import CategoryManagement from "./pages/CategoryManagement";
import ProductManagement from "./pages/ProductManagement"
import DailyCapacityLimit from "./pages/DailyCapacityLimit";
import AdminOrderManagement from "./pages/AdminOrderManagement";
import Settings from "./pages/Settings";
import Shop from "./pages/Shop";
import Cart from "./pages/Cart"; 
import Checkout from "./pages/Checkout";
import MyOrders from "./pages/MyOrders";
import CustomerProfile from "./pages/CustomerProfile";
import ProductDelivery from "./pages/ProductDeliveryPlaces";
import AdminPaymentManagement from "./pages/AdminPaymentManagement";
import RegisteredCustomers from "./pages/RegisteredCustomers";
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
          <Route path="/customer/profile" element={<CustomerProfile />} />

        {/* Admin Pages */}
        <Route path="/admin" element={<AdminLayout />}>
         <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="place" element={<ProductDelivery />} />
         <Route path="categories" element={<CategoryManagement />} />
          <Route path="products" element={<ProductManagement />} /> 
          <Route path="orders" element={<AdminOrderManagement />} />
            <Route path="payments" element={<AdminPaymentManagement />} />
            <Route path="customers" element={<RegisteredCustomers />} />
            <Route path="capacity" element={<DailyCapacityLimit />} />
            <Route path="settings" element={<Settings />} />
        </Route>

      </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;