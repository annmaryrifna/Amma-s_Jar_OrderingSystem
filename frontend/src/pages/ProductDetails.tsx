
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import API from "../services/api";
import "./css/ProductDetails.css";

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
interface ProductReview {
    review_id: number;
    product_id: number;
    rating: number;
    review_text: string;
    created_at: string;
    customer_name: string;
    product_name: string;
}
interface CartItem {
    product_id: number;
    product_name: string;
    image: string | null;
    quantity: number;
    unit: string;
    price: number;
    total_price: number;
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

function ProductDetails() {
    const { id } = useParams();

    const [product, setProduct] = useState<Product | null>(null);
    const [selectedQuantity, setSelectedQuantity] = useState("");
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [cartMessage, setCartMessage] = useState("");
    const [reviews, setReviews] = useState<ProductReview[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);

                const response = await API.get("/products");

                const foundProduct = response.data.products.find(
                    (item: Product) =>
                        item.product_id === Number(id) &&
                        (item.is_active === true || item.is_active === 1)
                );

                if (!foundProduct) {
                    setMessage("Product not found or unavailable.");
                    return;
                }

                setProduct(foundProduct);

                const options = parseOptions(
                    foundProduct.purchase_options
                );

                const initialQuantity = options.length > 0
                    ? options[0]
                    : Number(foundProduct.price_quantity);

                setSelectedQuantity(String(initialQuantity));

            } catch (error) {
                console.error("Product loading error:", error);
                setMessage("Unable to load product details.");
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);
    useEffect(() => {
        const fetchProductReviews = async () => {
            try {
                setReviewsLoading(true);

                const response = await API.get("/reviews/approved");

                const productReviews: ProductReview[] =
                    response.data.reviews || [];

                setReviews(
                    productReviews.filter(
                        (review) => review.product_id === Number(id)
                    )
                );

            } catch (error) {
                console.error("Product reviews loading error:", error);
            } finally {
                setReviewsLoading(false);
            }
        };

        fetchProductReviews();
    }, [id]);
    if (loading) {
        return <div className="details-status">Loading product details...</div>;
    }

    if (!product) {
        return (
            <div className="details-status">
                <p>{message || "Product not found."}</p>
                <Link to="/shop">Return to Shop</Link>
            </div>
        );
    }

    const options = parseOptions(product.purchase_options);

    const availableOptions = options.length > 0
        ? options
        : [Number(product.price_quantity)];

    const quantity = Number(selectedQuantity);
    const baseQuantity = Number(product.price_quantity);
    const basePrice = Number(product.price);

    const totalPrice = baseQuantity > 0
        ? (basePrice / baseQuantity) * quantity
        : 0;

    const handleAddToCart = () => {
        if (!quantity || quantity <= 0 || !Number.isFinite(totalPrice)) {
            setCartMessage("Please select a valid quantity.");
            return;
        }

        try {
            const existingCart: CartItem[] = JSON.parse(
                sessionStorage.getItem("cart") || "[]"
            );

            const newItem: CartItem = {
                product_id: product.product_id,
                product_name: product.product_name,
                image: product.image,
                quantity,
                unit: product.unit,
                price: basePrice,
                total_price: Number(totalPrice.toFixed(2)),
            };

            const existingIndex = existingCart.findIndex(
                (item) => item.product_id === product.product_id
            );

            if (existingIndex >= 0) {
                existingCart[existingIndex] = newItem;
            } else {
                existingCart.push(newItem);
            }

            sessionStorage.setItem("cart", JSON.stringify(existingCart));

            setCartMessage("Product added to cart successfully!");
        } catch (error) {
            console.error("Cart error:", error);
            setCartMessage("Unable to add product to cart.");
        }
    };

    return (
        <div className="product-details-page">

            <header className="details-header">
                <Link to="/" className="details-brand">
                    Amma's Secrete Jar
                </Link>

                <nav>
                    <Link to="/">Home</Link>
                    <Link to="/shop">Shop</Link>
                    <Link to="/customer/dashboard">My Dashboard</Link>
                </nav>
            </header>

            <main className="details-container">

                <Link to="/shop" className="back-to-shop">
                    ← Back to Shop
                </Link>

                <div className="details-content">

                    <div className="details-image">
                        {product.image ? (
                            <img
                                src={`http://localhost:5000${product.image}`}
                                alt={product.product_name}
                            />
                        ) : (
                            <div className="details-no-image">
                                Product image coming soon
                            </div>
                        )}
                    </div>

                    <div className="details-information">

                        <span className="details-category">
                            {product.main_category_name} / {product.subcategory_name}
                        </span>

                        <h1>{product.product_name}</h1>

                        <p className="details-description">
                            {product.description ||
                                "Freshly prepared homemade goodness."}
                        </p>

                        <p className="base-price">
                            Base price: ₹{basePrice.toFixed(2)} per{" "}
                            {product.price_quantity} {product.unit}
                        </p>

                        <div className="quantity-selection">
                            <label htmlFor="purchaseQuantity">
                                Select Purchase Quantity
                            </label>

                            <select
                                id="purchaseQuantity"
                                value={selectedQuantity}
                                onChange={(e) => {
                                    setSelectedQuantity(e.target.value);
                                    setCartMessage("");
                                }}
                            >
                                {availableOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {option} {product.unit}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="details-total">
                            <span>Total Price</span>
                            <strong>₹{totalPrice.toFixed(2)}</strong>
                        </div>

                        <button
                            type="button"
                            className="details-cart-button"
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
                {/* Customer Reviews */}
                <section className="product-reviews-section">
                    <div className="product-reviews-heading">
                        <span className="details-category">
                            CUSTOMER FEEDBACK
                        </span>
                        <h2>Customer Reviews</h2>
                    </div>

                    {reviewsLoading ? (
                        <p>Loading reviews...</p>
                    ) : reviews.length === 0 ? (
                        <p className="no-product-reviews">
                            No reviews available for this product yet.
                        </p>
                    ) : (
                        <>
                            <div className="product-review-summary">
                                <strong>
                                    {(
                                        reviews.reduce(
                                            (total, review) => total + review.rating,
                                            0
                                        ) / reviews.length
                                    ).toFixed(1)}
                                </strong>

                                <div>
                                    <div className="product-review-stars">
                                        {Array.from({ length: 5 }, (_, index) => (
                                            <span key={index}>
                                                {index <
                                                    Math.round(
                                                        reviews.reduce(
                                                            (total, review) =>
                                                                total + review.rating,
                                                            0
                                                        ) / reviews.length
                                                    )
                                                    ? "★"
                                                    : "☆"}
                                            </span>
                                        ))}
                                    </div>

                                    <p>Based on {reviews.length} review(s)</p>
                                </div>
                            </div>

                            <div className="product-reviews-list">
                                {reviews.map((review) => (
                                    <article
                                        className="product-review-card"
                                        key={review.review_id}
                                    >
                                        <div className="product-review-card-top">
                                            <strong>{review.customer_name}</strong>

                                            <span>
                                                {new Date(
                                                    review.created_at
                                                ).toLocaleDateString("en-IN", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </span>
                                        </div>

                                        <div className="product-review-stars">
                                            {Array.from(
                                                { length: 5 },
                                                (_, index) => (
                                                    <span key={index}>
                                                        {index < review.rating
                                                            ? "★"
                                                            : "☆"}
                                                    </span>
                                                )
                                            )}
                                        </div>

                                        <p>{review.review_text}</p>
                                    </article>
                                ))}
                            </div>
                        </>
                    )}
                </section>
            </main>

            <footer className="details-footer">
                © {new Date().getFullYear()} Amma's Secrete Jar. Made with love.
            </footer>

        </div>
    );
}

export default ProductDetails;
