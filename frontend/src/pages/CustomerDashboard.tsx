
import { Link } from "react-router-dom";
import "./css/CustomerDashboard.css";

function CustomerDashboard() {
    return (
        <div className="customer-dashboard">

            <header className="customer-header">
                <Link to="/" className="customer-brand">
                    Amma's Secrete Jar
                </Link>

                <nav className="customer-nav">
                    
                    <Link to="/shop">Shop</Link>
                    <Link to="/customer/orders">My Orders</Link>
                    <Link to="/customer/profile">My Profile</Link>
                    <button
                        className="logout-button"
                        onClick={() => {
                            sessionStorage.removeItem("token");
                            sessionStorage.removeItem("user");
                            sessionStorage.removeItem("cart");
                            window.location.href = "/login";
                        }}
                    >
                        Logout
                    </button>
                </nav>
            </header>

            <main>
                <section className="customer-welcome">
                    <div className="welcome-content">
                        <span className="welcome-label">
                            HOMEMADE WITH LOVE
                        </span>

                        <h1>Welcome to Amma's Secrete Jar!</h1>

                        <p>
                            Discover delicious homemade sweets and snacks,
                            lovingly prepared to bring happiness to your home.
                        </p>

                        <Link to="/shop" className="shop-button">
                            Explore Our Products
                        </Link>
                    </div>
                </section>

                <section className="customer-quick-links">
                    <h2>Your Account</h2>

                    <div className="quick-link-grid">

                        <Link to="/shop" className="quick-link-card">
                            <div className="quick-link-icon">01</div>
                            <h3>Browse Products</h3>
                            <p>Explore our homemade sweets and snacks.</p>
                        </Link>

                        <Link to="/customer/orders" className="quick-link-card">
                            <div className="quick-link-icon">02</div>
                            <h3>My Orders</h3>
                            <p>View your orders and track their status.</p>
                        </Link>

                        <Link to="/customer/profile" className="quick-link-card">
                            <div className="quick-link-icon">03</div>
                            <h3>My Profile</h3>
                            <p>View and manage your account details.</p>
                        </Link>

                    </div>
                </section>

                <section className="customer-featured">
                    <div>
                        <h2>A Taste of Homemade Happiness</h2>
                        <p>
                            From traditional sweets to delicious snacks,
                            find something special for every occasion.
                        </p>
                    </div>

                    <Link to="/shop" className="featured-link">
                        Explore the Collection →
                    </Link>
                </section>
            </main>

            <footer className="customer-footer">
                <p>© {new Date().getFullYear()} Amma's Secrete Jar. Made with love.</p>
            </footer>

        </div>
    );
}

export default CustomerDashboard;
