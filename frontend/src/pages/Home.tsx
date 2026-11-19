
import { Link } from "react-router-dom";
import {
    ArrowRight,
    ShoppingBag,
    Heart,
    Leaf,
    ChefHat, Phone,
    Mail,
    MapPin,
    MessageCircle
} from "lucide-react";
import "./css/Home.css";

function Home() {
    return (
        <div className="home-page">

            {/* Navigation */}
            <header className="home-header">
                <Link to="/" className="brand-logo">
                    <span>Amma's</span>
                    <strong>Secret Jar.</strong>
                </Link>

                <nav className="home-nav">
                    <Link to="/">Home</Link>
                    <Link to="/shop">Shop</Link>
                    <a href="#our-story">Our Story</a>
                    <a href="#contact">Contact</a>
                </nav>

                <div className="header-actions">
                    <Link to="/login" className="login-link">Login</Link>
                    <Link to="/register" className="register-button">
                        Register
                    </Link>
                    <Link to="/login" className="cart-link">
                        <ShoppingBag size={20} />
                    </Link>
                </div>
            </header>

            {/* Hero */}
            <section className="hero-section">
                <div className="hero-content">
                    <span className="eyebrow">HOMEMADE WITH LOVE</span>

                    <h1>
                        A Little Taste of Home,
                        <br />
                        In Every Bite.
                    </h1>

                    <p>
                        Discover the authentic flavours of homemade
                        sweets and traditional snacks, lovingly prepared
                        fresh from Amma's kitchen.
                    </p>

                    <div className="hero-actions">
                        <Link to="/shop" className="primary-button">
                            Explore Our Menu <ArrowRight size={18} />
                        </Link>

                        <Link to="/register" className="secondary-button">
                            Create Account
                        </Link>
                    </div>
                </div>

                <div className="hero-image">
                    <img
                        src="https://images.unsplash.com/photo-1601050690597-df0568f70950?w=1000"
                        alt="Fresh homemade traditional food"
                    />
                </div>
            </section>

            {/* Categories */}
            <section className="category-section">
                <div className="section-heading">
                    <span className="eyebrow">WHAT WE PREPARE</span>
                    <h2>Explore Our Collections</h2>
                    <p>Made with care, served with love.</p>
                </div>

                <div className="category-grid">
                    <Link to="/shop?category=sweets" className="category-card">
                        <img
                            src="https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&auto=format&fit=crop"
                            alt="Homemade sweets"
                        />
                        <div className="category-overlay">
                            <h3>Homemade Sweets</h3>
                            <span>Explore Sweets <ArrowRight size={16} /></span>
                        </div>
                    </Link>

                    <Link to="/shop?category=snacks" className="category-card">
                        <img
                            src="https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&auto=format&fit=crop"
                            alt="Homemade snacks"
                        />
                        <div className="category-overlay">
                            <h3>Traditional Snacks</h3>
                            <span>Explore Snacks <ArrowRight size={16} /></span>
                        </div>
                    </Link>
                </div>
            </section>

            {/* Why Choose Us */}
            <section className="why-section">
                <div className="section-heading">
                    <span className="eyebrow">THE AMMA'S SECRET JAR PROMISE</span>
                    <h2>Why Choose Us?</h2>
                </div>

                <div className="promise-grid">
                    <div className="promise-card">
                        <Heart />
                        <h3>Made with Love</h3>
                        <p>Every preparation receives personal care and attention.</p>
                    </div>

                    <div className="promise-card">
                        <Leaf />
                        <h3>Freshly Prepared</h3>
                        <p>Homemade food prepared fresh for your orders.</p>
                    </div>

                    <div className="promise-card">
                        <ChefHat />
                        <h3>Traditional Taste</h3>
                        <p>Enjoy familiar flavours and homemade goodness.</p>
                    </div>
                </div>
            </section>

            {/* Our Story */}
            <section className="story-section" id="our-story">
                <div>
                    <span className="eyebrow">A LITTLE STORY BEHIND THE JAR</span>
                    <h2>From Our Kitchen to Your Home</h2>
                    <p>
                        Amma's Secret Jar brings you homemade sweets
                        and snacks prepared with love, care and a passion
                        for sharing good food.
                    </p>
                    <Link to="/shop" className="primary-button">
                        Discover Our Food <ArrowRight size={18} />
                    </Link>
                </div>
            </section>




            {/* Footer */}
            <footer className="home-footer" id="contact">

                {/* Brand and Contact */}
                <div className="footer-top">

                    <div className="footer-brand">
                        <h2>Amma's Secrete Jar.</h2>
                        <p>Homemade goodness, made with love.</p>

                        <p>
                            Freshly prepared sweets and traditional snacks,
                            straight from our kitchen to your home.
                        </p>
                    </div>

                    <div className="footer-contact">
                        <h3>Get in Touch</h3>

                        <a href="tel:+919778525325">
                            <Phone size={15} />
                            <span>9778525325</span>
                        </a>

                        <a href="mailto:shanygrace1996@gmail.com">
                            <Mail size={15} />
                            <span>shanygrace1996@gmail.com</span>
                        </a>

                        <p>
                            <MapPin size={15} />
                            <span>303, Thuthiyoor, Kakkanad, Kerala</span>
                        </p>
                    </div>

                </div>

                {/* Map */}
                <div className="footer-map">
                    <h3 color="yellow">Find Us</h3>

                    <div className="map-container">
                        <iframe
                            title="Amma's Secrete Jar Location"
                            src="https://www.google.com/maps?q=9.9893688,76.3365725&output=embed"
                            width="100%"
                            height="220"
                            style={{ border: 0 }}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            allowFullScreen
                        />

                        <div className="map-address">
                            <div>
                                <strong>303, Thuthiyoor</strong>
                                <p>Kakkanad, Kerala</p>
                            </div>

                            <span className="location-badge">Location</span>
                        </div>

                        <a
                            href="https://www.google.com/maps/dir/?api=1&destination=9.9893688,76.3365725"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Open in Google Maps ↗
                        </a>
                    </div>
                </div>

                {/* Social Icons */}
                <div className="footer-social">
                    

                    <a
                        href="https://wa.me/919778525325"
                        aria-label="WhatsApp"
                    >
                        <MessageCircle size={18} />
                    </a>
                </div>

                {/* Copyright */}
                <p className="copyright">
                    © {new Date().getFullYear()} Amma's Secrete Jar.
                    All rights reserved.
                </p>

            </footer>




        </div>
    );
}

export default Home;
