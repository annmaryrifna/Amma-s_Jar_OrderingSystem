
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "./css/Cart.css";

function Cart() {
    const {
        cartItems,
        updateQuantity,
        removeFromCart,
        cartTotal,
    } = useCart();

    const imageUrl = (image: string | null) => {
        return image ? `http://localhost:5000${image}` : "";
    };

    return (
        <div className="cart-page">

            <header className="cart-header">
                <Link to="/" className="cart-brand">
                    Amma's Secrete Jar
                </Link>

                <nav>
                    <Link to="/">Home</Link>
                    <Link to="/shop">Shop</Link>
                    <Link to="/customer/dashboard">My Dashboard</Link>
                </nav>
            </header>

            <section className="cart-banner">
                <span>YOUR SELECTIONS</span>
                <h1>My Shopping Cart</h1>
                <p>Review your homemade favourites before booking.</p>
            </section>

            <main className="cart-content">

                {cartItems.length === 0 ? (
                    <div className="empty-cart">
                        <h2>Your cart is empty</h2>
                        <p>Explore our homemade sweets and snacks.</p>

                        <Link to="/shop" className="continue-shopping">
                            Explore Products
                        </Link>
                    </div>
                ) : (
                    <div className="cart-layout">

                        <section className="cart-items">
                            <h2>Cart Items ({cartItems.length})</h2>

                            {cartItems.map((item) => (
                                <div
                                    className="cart-item"
                                    key={item.product_id}
                                >
                                    <div className="cart-item-image">
                                        {item.image ? (
                                            <img
                                                src={imageUrl(item.image)}
                                                alt={item.product_name}
                                            />
                                        ) : (
                                            <span>No image</span>
                                        )}
                                    </div>

                                    <div className="cart-item-details">
                                        <h3>{item.product_name}</h3>

                                        <p className="cart-item-price">
                                            ₹{item.price.toFixed(2)}
                                            {" "}per {item.price_quantity} {item.unit}
                                        </p>

                                        <div className="cart-quantity">
                                            <label htmlFor={`quantity-${item.product_id}`}>
                                                Quantity:
                                            </label>

                                            <select
                                                id={`quantity-${item.product_id}`}
                                                value={item.quantity}
                                                onChange={(e) =>
                                                    updateQuantity(
                                                        item.product_id,
                                                        Number(e.target.value)
                                                    )
                                                }
                                            >
                                                {(
                                                    item.purchase_options?.length > 0
                                                        ? item.purchase_options
                                                        : [item.price_quantity]
                                                ).map((option) => (
                                                    <option key={option} value={option}>
                                                        {option} {item.unit}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <button
                                            type="button"
                                            className="remove-cart-item"
                                            onClick={() =>
                                                removeFromCart(item.product_id)
                                            }
                                        >
                                            Remove
                                        </button>
                                    </div>

                                    <div className="cart-item-total">
                                        ₹{item.total_price.toFixed(2)}
                                    </div>
                                </div>
                            ))}

                            <Link to="/shop" className="back-to-shop">
                                ← Continue Shopping
                            </Link>
                        </section>

                        <aside className="cart-summary">
                            <h2>Order Summary</h2>

                            <div className="summary-row">
                                <span>Subtotal</span>
                                <span>₹{cartTotal.toFixed(2)}</span>
                            </div>

                            <div className="summary-row">
                                <span>Delivery Charges</span>
                                <span>To be confirmed</span>
                            </div>

                            <div className="summary-total">
                                <span>Estimated Total</span>
                                <strong>₹{cartTotal.toFixed(2)}</strong>
                            </div>

                            <p className="cart-summary-note">
                                Your booking will be reviewed by our admin.
                                Payment details will be provided after approval.
                            </p>

                            <button
                                type="button"
                                className="checkout-button"
                                onClick={() => {
                                    window.location.href = "/checkout";
                                }}
                            >
                                Continue to Booking
                            </button>
                        </aside>

                    </div>
                )}

            </main>

            <footer className="cart-footer">
                © {new Date().getFullYear()} Amma's Secrete Jar. Made with love.
            </footer>

        </div>
    );
}

export default Cart;
