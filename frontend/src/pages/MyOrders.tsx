
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import "./css/MyOrders.css";

// Seller payment details
const UPI_ID = "shanygrace1969@okicici";
const UPI_QR_IMAGE = "/payment/UPI_image.jpeg";

interface OrderItem {
    product_id: number;
    product_name: string;
    quantity: number;
    unit: string;
    total_price: number;
}

interface Order {
    order_id: number;
    booking_date: string;
    booking_slot: string;
    booking_time: string;
    delivery_method: string;
    delivery_charge: number;
    subtotal: number;
    discount_amount: number;
    total_amount: number;
    advance_amount: number;
    balance_amount: number;
    order_status: string;
    payment_status: string;
    rejection_reason: string | null;
    items: OrderItem[];
}

type PaymentMethod = "upi_id" | "upi_qr";

interface PaymentSubmission {
    payment_id: number;
    order_id: number;
    payment_type: "advance" | "balance";
    payment_method: PaymentMethod;
    amount: number;
    transaction_reference: string;
    verification_status: "Pending" | "Verified" | "Rejected";
    admin_note: string | null;
    submitted_at: string;
    verified_at: string | null;
}

const MyOrders = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [payments, setPayments] = useState<PaymentSubmission[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [paymentMethods, setPaymentMethods] =
        useState<Record<number, PaymentMethod>>({});

    const [transactionReferences, setTransactionReferences] =
        useState<Record<number, string>>({});

    const [submittingOrder, setSubmittingOrder] =
        useState<number | null>(null);

    // Fetch bookings and payment history
    const fetchOrders = async () => {
        try {
            setError("");

            const [ordersResponse, paymentsResponse] =
                await Promise.all([
                    API.get("/orders/my-orders"),
                    API.get("/payments/my-submissions"),
                ]);

            setOrders(ordersResponse.data.orders || []);

            setPayments(
                paymentsResponse.data.payments ||
                paymentsResponse.data.submissions ||
                []
            );
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Unable to load your bookings."
            );
        } finally {
            setLoading(false);
        }
    };

    // Refresh payment history after submission
    const fetchPaymentHistory = async () => {
        try {
            const response = await API.get("/payments/my-submissions");

            setPayments(
                response.data.payments ||
                response.data.submissions ||
                []
            );
        } catch (err) {
            console.error(
                "Unable to refresh payment history:",
                err
            );
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // Format date
    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: "UTC",
        });
    };

    // Format time
    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(":").map(Number);

        return new Date(
            2000,
            0,
            1,
            hours,
            minutes
        ).toLocaleTimeString("en-IN", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    };

    // Change payment method
    const handlePaymentMethodChange = (
        orderId: number,
        method: PaymentMethod
    ) => {
        setPaymentMethods(previous => ({
            ...previous,
            [orderId]: method,
        }));
    };

    // Update transaction reference
    const handleReferenceChange = (
        orderId: number,
        reference: string
    ) => {
        setTransactionReferences(previous => ({
            ...previous,
            [orderId]: reference,
        }));
    };

    // Submit advance payment details
    const handlePaymentSubmit = async (order: Order) => {
        const method =
            paymentMethods[order.order_id] || "upi_id";

        const reference =
            transactionReferences[order.order_id]?.trim();

        if (method === "upi_id" && !UPI_ID.trim()) {
            alert(
                "UPI ID has not been configured. Please contact the seller."
            );
            return;
        }

        if (method === "upi_qr" && !UPI_QR_IMAGE.trim()) {
            alert(
                "UPI QR code has not been configured. Please contact the seller."
            );
            return;
        }

        if (!reference || reference.length < 6) {
            alert(
                "Please enter a valid UTR or transaction reference."
            );
            return;
        }

        if (reference.length > 150) {
            alert(
                "Transaction reference cannot exceed 150 characters."
            );
            return;
        }

        try {
            setSubmittingOrder(order.order_id);

            const response = await API.post("/payments", {
                orderId: order.order_id,
                paymentType: "advance",
                paymentMethod: method,
                transactionReference: reference,
            });

            alert(
                response.data.message ||
                "Payment details submitted successfully."
            );

            await fetchPaymentHistory();

            setTransactionReferences(previous => ({
                ...previous,
                [order.order_id]: "",
            }));
        } catch (err: any) {
            alert(
                err.response?.data?.message ||
                "Unable to submit payment details."
            );
        } finally {
            setSubmittingOrder(null);
        }
    };

    if (loading) {
        return (
            <div className="orders-message">
                Loading your bookings...
            </div>
        );
    }

    if (error) {
        return (
            <div className="orders-message orders-error">
                {error}
            </div>
        );
    }

    return (
        <div className="my-orders-page">
            <header className="orders-header">
                <Link to="/" className="orders-brand">
                    Amma's Secrete Jar
                </Link>

                <nav>
                    <Link to="/shop">Shop</Link>
                    <Link to="/cart">Cart</Link>
                    <Link to="/customer/dashboard">
                        Dashboard
                    </Link>
                </nav>
            </header>

            <main className="orders-container">
                <div className="orders-heading">
                    <p className="orders-eyebrow">
                        YOUR ACCOUNT
                    </p>

                    <h1>My Bookings</h1>

                    <p>
                        View and track all your booking requests.
                    </p>
                </div>

                {orders.length === 0 ? (
                    <div className="orders-empty">
                        <h2>No bookings yet</h2>
                        <p>Your bookings will appear here.</p>

                        <Link to="/shop">
                            Explore Our Collections
                        </Link>
                    </div>
                ) : (
                    <div className="orders-list">
                        {orders.map(order => {
                            const paymentMethod =
                                paymentMethods[order.order_id] || "upi_id";

                            const isApproved =
                                order.order_status ===
                                "Approved – Awaiting Payment";

                            // Get latest advance payment submission
                            const advancePayment = payments
                                .filter(
                                    payment =>
                                        payment.order_id === order.order_id &&
                                        payment.payment_type === "advance"
                                )
                                .sort(
                                    (a, b) =>
                                        new Date(b.submitted_at).getTime() -
                                        new Date(a.submitted_at).getTime()
                                )[0];

                            return (
                                <article
                                    className="order-card"
                                    key={order.order_id}
                                >
                                    {/* Booking Header */}
                                    <div className="order-card-header">
                                        <div>
                                            <h2>
                                                Booking #{order.order_id}
                                            </h2>

                                            <p>
                                                Placed on{" "}
                                                {formatDate(order.booking_date)}
                                            </p>
                                        </div>

                                        <span className="order-status">
                                            {order.order_status}
                                        </span>
                                    </div>

                                    {/* Approval Message */}
                                    {isApproved && (
                                        <div className="booking-approved-message">
                                            <h3>
                                                Your booking has been approved!
                                            </h3>

                                            {Number(order.discount_amount) > 0 ? (
                                                <p>
                                                    Congratulations! Your
                                                    first-booking discount of ₹
                                                    {Number(
                                                        order.discount_amount
                                                    ).toFixed(2)}{" "}
                                                    has been applied.
                                                </p>
                                            ) : (
                                                <p>
                                                    Your booking is approved.
                                                    Please complete the advance
                                                    payment.
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Booking Details */}
                                    <div className="order-details">
                                        <div>
                                            <span>Booking date</span>
                                            <strong>
                                                {formatDate(order.booking_date)}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Preferred time</span>
                                            <strong>
                                                {formatTime(order.booking_time)}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Delivery method</span>
                                            <strong>
                                                {order.delivery_method === "pickup"
                                                    ? "Self Pickup"
                                                    : "Home Delivery"}
                                            </strong>
                                        </div>
                                    </div>

                                    {/* Ordered Products */}
                                    <div className="order-products">
                                        <h3>Ordered Products</h3>

                                        {order.items.map((item, index) => (
                                            <div
                                                className="order-product-row"
                                                key={`${item.product_id}-${index}`}
                                            >
                                                <span>
                                                    {item.product_name} ×{" "}
                                                    {item.quantity} {item.unit}
                                                </span>

                                                <strong>
                                                    ₹
                                                    {Number(
                                                        item.total_price
                                                    ).toFixed(2)}
                                                </strong>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Price Summary */}
                                    <div className="order-summary">
                                        <div>
                                            <span>Subtotal</span>
                                            <strong>
                                                ₹
                                                {Number(
                                                    order.subtotal
                                                ).toFixed(2)}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Discount</span>
                                            <strong className="discount-value">
                                                - ₹
                                                {Number(
                                                    order.discount_amount
                                                ).toFixed(2)}
                                            </strong>
                                        </div>
                                        <div>
                                            <span>Delivery Charge</span>
                                            <strong>
                                                ₹
                                                {Number(
                                                    order.delivery_charge || 0
                                                ).toFixed(2)}
                                            </strong>
                                        </div>
                                        <div>
                                            <span>Total amount</span>
                                            <strong>
                                                ₹
                                                {Number(
                                                    order.total_amount
                                                ).toFixed(2)}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Advance amount (40%)</span>
                                            <strong>
                                                ₹
                                                {Number(
                                                    order.advance_amount
                                                ).toFixed(2)}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Balance amount (60%)</span>
                                            <strong>
                                                ₹
                                                {Number(
                                                    order.balance_amount
                                                ).toFixed(2)}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Payment status</span>
                                            <strong>
                                                {order.payment_status}
                                            </strong>
                                        </div>
                                    </div>

                                    {/* Advance Payment Section */}
                                    {isApproved && (
                                        <div className="customer-payment-section">
                                            <h3>Pay Your Advance Amount</h3>

                                            <p>
                                                Please pay{" "}
                                                <strong>
                                                    ₹
                                                    {Number(
                                                        order.advance_amount
                                                    ).toFixed(2)}
                                                </strong>{" "}
                                                using either of the payment
                                                methods below.
                                            </p>

                                            {/* Pending Payment */}
                                            {advancePayment?.verification_status === "Pending" && (
                                                <div className="payment-submitted-message">
                                                    <h4>
                                                        Payment details submitted!
                                                    </h4>

                                                    <p>
                                                        Your payment is awaiting
                                                        verification by the seller.
                                                    </p>

                                                    <p>
                                                        Transaction Reference:{" "}
                                                        <strong>
                                                            {advancePayment.transaction_reference}
                                                        </strong>
                                                    </p>

                                                    <p>
                                                        Status:{" "}
                                                        <strong>
                                                            {advancePayment.verification_status}
                                                        </strong>
                                                    </p>
                                                </div>
                                            )}

                                            {/* Verified Payment */}
                                            {advancePayment?.verification_status === "Verified" && (
                                                <div className="payment-submitted-message">
                                                    <h4>
                                                        Advance payment verified!
                                                    </h4>

                                                    <p>
                                                        Your advance payment has
                                                        been successfully verified
                                                        by the seller.
                                                    </p>
                                                </div>
                                            )}

                                            {/* Payment Form / Resubmission */}
                                            {(!advancePayment ||
                                                advancePayment.verification_status === "Rejected") && (
                                                    <>
                                                        {advancePayment?.verification_status === "Rejected" && (
                                                            <div className="booking-rejected-message">
                                                                <h4>
                                                                    Payment submission rejected
                                                                </h4>

                                                                <p>
                                                                    {advancePayment.admin_note ||
                                                                        "Please check your payment details and submit again."}
                                                                </p>

                                                                <p>
                                                                    Previous transaction
                                                                    reference:{" "}
                                                                    {advancePayment.transaction_reference}
                                                                </p>
                                                            </div>
                                                        )}

                                                        <div className="payment-method-options">
                                                            <label>
                                                                <input
                                                                    type="radio"
                                                                    name={`payment-${order.order_id}`}
                                                                    checked={paymentMethod === "upi_id"}
                                                                    onChange={() =>
                                                                        handlePaymentMethodChange(
                                                                            order.order_id,
                                                                            "upi_id"
                                                                        )
                                                                    }
                                                                />
                                                                Pay using UPI ID
                                                            </label>

                                                            <label>
                                                                <input
                                                                    type="radio"
                                                                    name={`payment-${order.order_id}`}
                                                                    checked={paymentMethod === "upi_qr"}
                                                                    onChange={() =>
                                                                        handlePaymentMethodChange(
                                                                            order.order_id,
                                                                            "upi_qr"
                                                                        )
                                                                    }
                                                                />
                                                                Pay using QR Code
                                                            </label>
                                                        </div>

                                                        {/* UPI ID */}
                                                        {paymentMethod === "upi_id" && (
                                                            <div className="payment-instructions">
                                                                <h4>UPI Payment</h4>

                                                                {UPI_ID ? (
                                                                    <div className="upi-id-row">
                                                                        <strong>
                                                                            {UPI_ID}
                                                                        </strong>

                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                navigator.clipboard.writeText(
                                                                                    UPI_ID
                                                                                )
                                                                            }
                                                                        >
                                                                            Copy UPI ID
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <p>
                                                                        UPI ID is not
                                                                        configured yet.
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* QR Code */}
                                                        {paymentMethod === "upi_qr" && (
                                                            <div className="payment-instructions">
                                                                <h4>Scan and Pay</h4>

                                                                {UPI_QR_IMAGE ? (
                                                                    <img
                                                                        src={UPI_QR_IMAGE}
                                                                        alt="Amma's Secrete Jar UPI QR code"
                                                                        className="payment-qr-image"
                                                                    />
                                                                ) : (
                                                                    <p>
                                                                        UPI QR code is
                                                                        not configured yet.
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Transaction Reference */}
                                                        <div className="transaction-reference">
                                                            <label>
                                                                UTR / Transaction Reference
                                                            </label>

                                                            <input
                                                                type="text"
                                                                value={
                                                                    transactionReferences[
                                                                    order.order_id
                                                                    ] || ""
                                                                }
                                                                onChange={e =>
                                                                    handleReferenceChange(
                                                                        order.order_id,
                                                                        e.target.value
                                                                    )
                                                                }
                                                                placeholder="Enter your transaction reference"
                                                                maxLength={150}
                                                            />

                                                            <small>
                                                                Complete your payment
                                                                first, then enter the
                                                                transaction reference
                                                                shown by your payment app.
                                                            </small>
                                                        </div>

                                                        {/* Submit Button */}
                                                        <button
                                                            className="payment-submit-button"
                                                            type="button"
                                                            onClick={() =>
                                                                handlePaymentSubmit(order)
                                                            }
                                                            disabled={
                                                                submittingOrder ===
                                                                order.order_id
                                                            }
                                                        >
                                                            {submittingOrder ===
                                                                order.order_id
                                                                ? "Submitting..."
                                                                : "Submit Payment Details"}
                                                        </button>
                                                    </>
                                                )}
                                        </div>
                                    )}

                                    {/* Confirmed Booking */}
                                    {order.order_status === "Confirmed" && (
                                        <div className="payment-submitted-message">
                                            <h4>Your booking is confirmed!</h4>

                                            <p>
                                                Your advance payment has been
                                                verified.
                                            </p>

                                            <p>
                                                Remaining balance: ₹
                                                {Number(
                                                    order.balance_amount
                                                ).toFixed(2)}
                                            </p>
                                        </div>
                                    )}

                                    {/* Rejected Booking */}
                                    {order.order_status === "Rejected" && (
                                        <div className="booking-rejected-message">
                                            <h4>Booking request rejected</h4>

                                            <p>
                                                {order.rejection_reason ||
                                                    "Your booking request was rejected. Please contact the seller for more information."}
                                            </p>

                                            <p>
                                                You can place a new booking by visiting our shop.
                                            </p>

                                            <Link to="/shop">
                                                Create a New Booking
                                            </Link>
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
};

export default MyOrders;
