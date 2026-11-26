
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import "./css/Shop.css";
import CustomerSettingsMenu from "./CustomerSettingsMenu";
import { useCart, type CartItem } from "../context/CartContext";

interface Category {
    category_id: number;
    category_name: string;
    parent_category_id: number | null;
}

interface Product {
    product_id: number;
    product_name: string;
    main_category_name: string;
    subcategory_name: string;
    description: string | null;
    image: string | null;
    price: number;
    price_quantity: number;
    unit: string;
    purchase_options: number[] | string | null;
    is_active: boolean | number;
}



function parseOptions(options: Product["purchase_options"]): number[] {
    if (!options) return [];

    try {
        const parsed = typeof options === "string"
            ? JSON.parse(options)
            : options;

        return Array.isArray(parsed)
            ? parsed.map(Number).filter(
                (value) => Number.isFinite(value) && value > 0
            )
            : [];
    } catch {
        return [];
    }
}

function Shop() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedMainCategory, setSelectedMainCategory] = useState("All");
    const [selectedSubcategory, setSelectedSubcategory] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedQuantity, setSelectedQuantity] = useState("");
    const [showAuthPrompt, setShowAuthPrompt] = useState(false);
    const [cartMessage, setCartMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const { addToCart, cartCount } = useCart();
    useEffect(() => {
        const fetchShopData = async () => {
            try {
                setLoading(true);

                const [categoryResponse, productResponse] = await Promise.all([
                    API.get("/categories"),
                    API.get("/products"),
                ]);

                setCategories(categoryResponse.data.categories || []);
                setProducts(productResponse.data.products || []);
            } catch (error) {
                console.error("Shop loading error:", error);
                setMessage("Unable to load products. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchShopData();
    }, []);

    const mainCategories = categories.filter(
        (category) => category.parent_category_id === null
    );

    const subcategories = categories.filter((category) => {
        if (category.parent_category_id === null) return false;
        if (selectedMainCategory === "All") return true;

        const parent = mainCategories.find(
            (main) => main.category_id === category.parent_category_id
        );

        return parent?.category_name === selectedMainCategory;
    });

    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const isActive =
                product.is_active === true || product.is_active === 1;

            const matchesMain =
                selectedMainCategory === "All" ||
                product.main_category_name === selectedMainCategory;

            const matchesSubcategory =
                selectedSubcategory === "All" ||
                product.subcategory_name === selectedSubcategory;

            const search = searchTerm.trim().toLowerCase();

            const matchesSearch =
                product.product_name.toLowerCase().includes(search) ||
                (product.description || "").toLowerCase().includes(search) ||
                product.subcategory_name.toLowerCase().includes(search);

            return isActive && matchesMain && matchesSubcategory && matchesSearch;
        });
    }, [products, selectedMainCategory, selectedSubcategory, searchTerm]);

    const openProduct = (product: Product) => {
        const options = parseOptions(product.purchase_options);
        const initialQuantity = options.length > 0
            ? options[0]
            : Number(product.price_quantity);

        setSelectedProduct(product);
        setSelectedQuantity(String(initialQuantity));
        setCartMessage("");
        setShowAuthPrompt(false);
    };

    const closeProduct = () => {
        setSelectedProduct(null);
        setShowAuthPrompt(false);
        setCartMessage("");
    };

    const quantity = Number(selectedQuantity);
    const baseQuantity = Number(selectedProduct?.price_quantity || 0);
    const basePrice = Number(selectedProduct?.price || 0);

    const totalPrice = baseQuantity > 0
        ? (basePrice / baseQuantity) * quantity
        : 0;


    const handleAddToCart = () => {
        const token = sessionStorage.getItem("token");
        const storedUser = sessionStorage.getItem("user");

        let user = null;

        try {
            user = storedUser ? JSON.parse(storedUser) : null;
        } catch {
            user = null;
        }

        if (!token || user?.role !== "customer") {
            setShowAuthPrompt(true);
            return;
        }

        if (!selectedProduct || quantity <= 0 || !Number.isFinite(totalPrice)) {
            setCartMessage("Please select a valid purchase quantity.");
            return;
        }

        try {
            const newItem: CartItem = {
                product_id: selectedProduct.product_id,
                product_name: selectedProduct.product_name,
                image: selectedProduct.image,
                quantity,
                unit: selectedProduct.unit,
                price: basePrice,
                price_quantity: selectedProduct.price_quantity,
                total_price: Number(totalPrice.toFixed(2)),
                purchase_options: parseOptions(selectedProduct.purchase_options),
            };

            addToCart(newItem);

            setCartMessage("Product added to your cart successfully!");
        } catch (error) {
            console.error("Cart error:", error);
            setCartMessage("Unable to add product to cart.");
        }
    };


    return (
        <div className="shop-page">

            <header className="shop-header">
                <Link to="/" className="shop-brand">
                    Amma's Secrete Jar
                </Link>

                <nav className="shop-nav">
                    <Link to="/customer/dashboard"> Home</Link>
                    <Link to="/customer/orders">My Orders</Link>
                    <Link to="/cart"> My Cart<span className="cart-count">{cartCount}</span></Link>
                    <CustomerSettingsMenu />
                </nav>
            </header>

            <section className="shop-banner">
                <span>MADE WITH LOVE, SERVED WITH CARE</span>
                <h1>Our Homemade Collection</h1>
                <p>
                    Explore our delicious selection of traditional sweets
                    and snacks, freshly prepared for you.
                </p>
            </section>

            <main className="shop-content">

                <div className="shop-heading">
                    <div>
                        <h2>Explore Our Products</h2>
                        <p>Find something delicious for every occasion.</p>
                    </div>
                </div>

                <div className="shop-filters">
                    <div className="category-filters">
                        <button
                            className={selectedMainCategory === "All" ? "active" : ""}
                            onClick={() => {
                                setSelectedMainCategory("All");
                                setSelectedSubcategory("All");
                            }}
                        >
                            All Products
                        </button>

                        {mainCategories.map((category) => (
                            <button
                                key={category.category_id}
                                className={
                                    selectedMainCategory === category.category_name
                                        ? "active"
                                        : ""
                                }
                                onClick={() => {
                                    setSelectedMainCategory(category.category_name);
                                    setSelectedSubcategory("All");
                                }}
                            >
                                {category.category_name}
                            </button>
                        ))}
                    </div>

                    <input
                        type="search"
                        className="shop-search"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {selectedMainCategory !== "All" && (
                    <div className="subcategory-filters">
                        <button
                            className={selectedSubcategory === "All" ? "active" : ""}
                            onClick={() => setSelectedSubcategory("All")}
                        >
                            All Subcategories
                        </button>

                        {subcategories.map((category) => (
                            <button
                                key={category.category_id}
                                className={
                                    selectedSubcategory === category.category_name
                                        ? "active"
                                        : ""
                                }
                                onClick={() => setSelectedSubcategory(category.category_name)}
                            >
                                {category.category_name}
                            </button>
                        ))}
                    </div>
                )}

                {loading ? (
                    <p className="shop-status">Loading products...</p>
                ) : message ? (
                    <p className="shop-status shop-error">{message}</p>
                ) : filteredProducts.length === 0 ? (
                    <p className="shop-status">
                        No products found. Try another category or search.
                    </p>
                ) : (
                    <>
                        <p className="product-count">
                            Showing {filteredProducts.length} product(s)
                        </p>

                        <div className="shop-product-grid">
                            {filteredProducts.map((product) => (
                                <button
                                    type="button"
                                    className="shop-product-card"
                                    key={product.product_id}
                                    onClick={() => openProduct(product)}
                                >
                                    <div className="shop-product-image">
                                        {product.image ? (
                                            <img
                                                src={`http://localhost:5000${product.image}`}
                                                alt={product.product_name}
                                            />
                                        ) : (
                                            <div className="no-product-image">
                                                Image coming soon
                                            </div>
                                        )}
                                    </div>

                                    <div className="shop-product-info">
                                        <h3>{product.product_name}</h3>
                                        <p className="product-price">
                                            ₹{Number(product.price).toFixed(2)}
                                            <span>
                                                {" "}per {product.price_quantity} {product.unit}
                                            </span>
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </>
                )}

            </main>

            <footer className="shop-footer">
                <p>
                    © {new Date().getFullYear()} Amma's Secrete Jar. Made with love.
                </p>
            </footer>

            {/* Product Details Pop-up */}
            {selectedProduct && (
                <div
                    className="product-modal-overlay"
                    onClick={closeProduct}
                >
                    <div
                        className="product-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-product-name"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="modal-close"
                            onClick={closeProduct}
                            aria-label="Close product details"
                        >
                            ×
                        </button>

                        <div className="modal-product-image">
                            {selectedProduct.image ? (
                                <img
                                    src={`http://localhost:5000${selectedProduct.image}`}
                                    alt={selectedProduct.product_name}
                                />
                            ) : (
                                <div className="no-product-image">
                                    Image coming soon
                                </div>
                            )}
                        </div>

                        <div className="modal-product-info">
                            <span className="product-category">
                                {selectedProduct.main_category_name} /{" "}
                                {selectedProduct.subcategory_name}
                            </span>

                            <h2 id="modal-product-name">
                                {selectedProduct.product_name}
                            </h2>

                            <p className="modal-description">
                                {selectedProduct.description ||
                                    "Freshly prepared homemade goodness."}
                            </p>

                            <p className="modal-base-price">
                                ₹{basePrice.toFixed(2)} per{" "}
                                {selectedProduct.price_quantity}{" "}
                                {selectedProduct.unit}
                            </p>

                            <label
                                className="modal-quantity-label"
                                htmlFor="modal-quantity"
                            >
                                Select Purchase Quantity
                            </label>

                            <select
                                id="modal-quantity"
                                className="modal-quantity-select"
                                value={selectedQuantity}
                                onChange={(e) => {
                                    setSelectedQuantity(e.target.value);
                                    setCartMessage("");
                                }}
                            >
                                {(parseOptions(selectedProduct.purchase_options).length > 0
                                    ? parseOptions(selectedProduct.purchase_options)
                                    : [Number(selectedProduct.price_quantity)]
                                ).map((option) => (
                                    <option key={option} value={option}>
                                        {option} {selectedProduct.unit}
                                    </option>
                                ))}
                            </select>

                            <div className="modal-total">
                                <span>Total Price</span>
                                <strong>₹{totalPrice.toFixed(2)}</strong>
                            </div>

                            <button
                                type="button"
                                className="modal-add-cart"
                                onClick={handleAddToCart}
                            >
                                Add to Cart
                            </button>

                            {cartMessage && (
                                <p className="cart-feedback" role="status">
                                    {cartMessage}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Guest Registration / Login Prompt */}
            {showAuthPrompt && (
                <div
                    className="auth-modal-overlay"
                    onClick={() => setShowAuthPrompt(false)}
                >
                    <div
                        className="auth-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="auth-modal-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="modal-close"
                            onClick={() => setShowAuthPrompt(false)}
                            aria-label="Close"
                        >
                            ×
                        </button>

                        <h2 id="auth-modal-title">
                            Register to Continue
                        </h2>

                        <p>
                            Please create an account or log in to add products
                            to your cart and place an order.
                        </p>

                        <Link
                            to="/register"
                            className="auth-register-button"
                        >
                            Create an Account
                        </Link>

                        <Link
                            to="/login"
                            className="auth-login-link"
                        >
                            Already have an account? Login
                        </Link>
                    </div>
                </div>
            )}

        </div>
    );
}

export default Shop;
