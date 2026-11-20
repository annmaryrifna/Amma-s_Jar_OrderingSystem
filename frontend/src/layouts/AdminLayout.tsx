import { NavLink, Outlet } from "react-router-dom";
import "./AdminLayout.css";
import {
    LayoutDashboard,
    ShoppingBag,
    Package,
    Tags,
    Users,
    CalendarDays,
    Settings,
    LogOut,
    ChefHat,
    Truck,
} from "lucide-react";

function AdminLayout() {
    return (
        <div className="admin-layout">

            {/* Sidebar */}
            <aside className="admin-sidebar">

                <h2 className="admin-logo">
                    <ChefHat size={28} />
                    HomeFoods
                </h2>

                <div className="admin-profile">
                    <div className="profile-icon">A</div>
                    <div>
                        <h4>Admin</h4>
                        <p>Super Admin</p>
                    </div>
                </div>

                <nav className="admin-nav">

                    <NavLink to="/admin/dashboard">
                        <LayoutDashboard size={19} />
                        Dashboard
                    </NavLink>

                    <NavLink to="/admin/categories">
                        <Tags size={19} />
                        Categories
                    </NavLink>

                    <NavLink to="/admin/products">
                        <Package size={19} />
                        Products
                    </NavLink>

                    <NavLink to="/admin/orders">
                        <ShoppingBag size={19} />
                        Orders
                    </NavLink>

                    <NavLink to="/admin/capacity">
                        <CalendarDays size={19} />
                        Daily Capacity
                    </NavLink>
                    <NavLink to="/admin/place">
                        <Truck size={19} />
                        Product Delivery
                    </NavLink>
                    <NavLink to="/admin/customers">
                        <Users size={19} />
                        Customers
                    </NavLink>
                    <NavLink to="/admin/payments">
                        
                        Payments 
                    </NavLink>
                    <NavLink to="/admin/settings">
                        <Settings size={19} />
                        Settings
                    </NavLink>

                </nav>

                <button className="admin-logout">
                    <LogOut size={19} />
                    Logout
                </button>

            </aside>

            {/* Main Content */}
            <main className="admin-main">
                <header className="admin-header">
                    <h3>Admin Panel</h3>
                    <span>Welcome back!</span>
                </header>

                <section className="admin-content">
                    <Outlet />
                </section>
            </main>

        </div>
    );
}

export default AdminLayout;