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
    Truck,IndianRupee,
} from "lucide-react";

function AdminLayout() {
    return (
        <div className="admin-layout">

            {/* Sidebar */}
            <aside className="admin-sidebar">

                <h2 className="admin-logo">
                    <ChefHat size={28} />
                    Amma's Secret Jar
                </h2>

                <div className="admin-profile">
                    <div className="profile-icon">SJ</div>
                    <div>
                        <h4>Admin</h4>
                        <p>Shany Johnson</p>
                    </div>
                </div>

                <nav className="admin-nav">

                    <NavLink to="/admin/dashboard">
                        <LayoutDashboard size={19} />
                        Dashboard
                    </NavLink>
                    <NavLink to="/admin/customers">
                        <Users size={19} />
                        Customers
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
                    <NavLink to="/admin/payments">
                        <IndianRupee size={19} />
                        Payments
                    </NavLink>
                    <NavLink to="/admin/capacity">
                        <CalendarDays size={19} />
                        Daily Capacity Limit
                    </NavLink>
                    <NavLink to="/admin/place">
                        <Truck size={19} />
                        Product Delivery
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
                    <h3>Home - Dream - Kitchen</h3>
                    <span>Welcome Shany!</span>
                </header>

                <section className="admin-content">
                    <Outlet />
                </section>
            </main>

        </div>
    );
}

export default AdminLayout;