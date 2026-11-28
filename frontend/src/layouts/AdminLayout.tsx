
import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "./AdminLayout.css";
import API from "../services/api";
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
    IndianRupee,
    MessageSquareWarning,
    Star,
    UserRound,
    LockKeyhole,
} from "lucide-react";

function AdminLayout() {
    const navigate = useNavigate();

    const [settingsOpen, setSettingsOpen] = useState(false);
    const settingsRef = useRef<HTMLDivElement>(null);

    const handleLogout = () => {
        sessionStorage.removeItem("token");
        navigate("/", { replace: true });
    };
    const [adminName, setAdminName] = useState("Admin");

    useEffect(() => {
        const fetchAdminName = async () => {
            try {
                const response = await API.get("/admin/account/profile");
                setAdminName(response.data.profile.name);
            } catch (error) {
                console.error("Unable to fetch admin name:", error);
            }
        };

        fetchAdminName();
    }, []);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                settingsRef.current &&
                !settingsRef.current.contains(event.target as Node)
            ) {
                setSettingsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const openProfile = () => {
        setSettingsOpen(false);
        navigate("/admin/settings", {
            state: { section: "profile" },
        });
    };

    const openChangePassword = () => {
        setSettingsOpen(false);
        navigate("/admin/settings", {
            state: { section: "password" },
        });
    };

    return (
        <div className="admin-layout">

            {/* Sidebar */}
            <aside className="admin-sidebar">

                <h2 className="admin-logo">
                    <ChefHat size={28} />
                    Amma's Secret Jar
                </h2>

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

                    <NavLink to="/admin/complaints">
                        <MessageSquareWarning size={19} />
                        Complaints
                    </NavLink>

                    <NavLink to="/admin/reviews">
                        <Star size={18} />
                        Reviews
                    </NavLink>

                    <NavLink to="/admin/capacity">
                        <CalendarDays size={19} />
                        Daily Capacity Limit
                    </NavLink>

                    <NavLink to="/admin/place">
                        <Truck size={19} />
                        Product Delivery
                    </NavLink>

                </nav>
            </aside>

            {/* Main Content */}
            <main className="admin-main">

                <header className="admin-header">

                    <h3>Home - Dream - Kitchen</h3>

                    <div className="admin-header-actions">

                        <span className="admin-welcome">Welcome, {adminName}!</span>

                        {/* Settings Dropdown */}
                        <div
                            className="admin-settings-wrapper"
                            ref={settingsRef}
                        >
                            <button
                                type="button"
                                className={`admin-settings-button ${settingsOpen ? "active" : ""
                                    }`}
                                onClick={() =>
                                    setSettingsOpen((previous) => !previous)
                                }
                                aria-label="Admin settings"
                                aria-expanded={settingsOpen}
                            >
                                <Settings size={21} />
                            </button>

                            {settingsOpen && (
                                <div className="admin-settings-dropdown">

                                    <div className="dropdown-heading">
                                        <div className="dropdown-profile-icon">
                                            <UserRound size={20} />
                                        </div>

                                        <div>
                                            <strong>Admin</strong>
                                            <p>Account Settings</p>
                                        </div>
                                    </div>

                                    <div className="dropdown-divider" />

                                    <button
                                        type="button"
                                        onClick={openProfile}
                                    >
                                        <UserRound size={17} />
                                        My Profile
                                    </button>

                                    <button
                                        type="button"
                                        onClick={openChangePassword}
                                    >
                                        <LockKeyhole size={17} />
                                        Change Password
                                    </button>

                                    <div className="dropdown-divider" />

                                    <button
                                        type="button"
                                        className="dropdown-logout"
                                        onClick={handleLogout}
                                    >
                                        <LogOut size={17} />
                                        Logout
                                    </button>

                                </div>
                            )}
                        </div>

                    </div>
                </header>

                <section className="admin-content">
                    <Outlet />
                </section>

            </main>
        </div>
    );
}

export default AdminLayout;
