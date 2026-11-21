
import { useState,useEffect } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import "./css/Checkout.css";
interface DeliveryArea {
    area_id: number;
    area_name: string;
    pincode: string;
    delivery_charge: number;
}
function Checkout() {
    const { cartItems, cartTotal ,clearCart} = useCart();
    const [houseName, setHouseName] = useState("");
    const [street, setStreet] = useState("");
    const [landmark, setLandmark] = useState("");
    const [pincode, setPincode] = useState("");
    const [deliveryAreas, setDeliveryAreas] = useState<DeliveryArea[]>([]);
    const [selectedAreaId, setSelectedAreaId] = useState("");
    const [deliveryCharge, setDeliveryCharge] = useState(0);
    const [isCheckingDelivery, setIsCheckingDelivery] = useState(false);
    const [deliveryMessage, setDeliveryMessage] = useState("");
    const [specialInstructions, setSpecialInstructions] = useState("");
    const [formError, setFormError] = useState("");
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [customer, setCustomer] = useState({
    
        name: "",
        phone: "",
        email: "",
    });

    useEffect(() => {
        try {
            const storedUser = sessionStorage.getItem("user");

            if (storedUser) {
                const user = JSON.parse(storedUser);

                setCustomer({
                    name: user.name || "",
                    phone: user.phone || "",
                    email: user.email || "",
                });
            }
        } catch (error) {
            console.error("Unable to load customer information:", error);
        }
    }, []);
    const [deliveryMethod, setDeliveryMethod] = useState("delivery");
    const [selectedSlot, setSelectedSlot] = useState("morning");
    const [selectedTime, setSelectedTime] = useState("10:00");

    const [bookingDate, setBookingDate] = useState("");
    useEffect(() => {
        if (deliveryMethod !== "delivery" || !/^\d{6}$/.test(pincode)) {
            setDeliveryAreas([]);
            setSelectedAreaId("");
            setDeliveryCharge(0);
            setDeliveryMessage("");
            setIsCheckingDelivery(false);
            return;
        }

        let cancelled = false;

        const checkDelivery = async () => {
            try {
                setIsCheckingDelivery(true);
                setDeliveryMessage("");
                setDeliveryAreas([]);
                setSelectedAreaId("");
                setDeliveryCharge(0);

                const response = await API.get(
                    `/orders/delivery-areas/${pincode}`
                );

                if (cancelled) return;

                const areas: DeliveryArea[] = response.data.areas || [];

                setDeliveryAreas(areas);

                if (areas.length === 1) {
                    setSelectedAreaId(String(areas[0].area_id));
                    setDeliveryCharge(Number(areas[0].delivery_charge));
                    setDeliveryMessage("Delivery is available in your locality.");
                } else if (areas.length > 1) {
                    setDeliveryMessage("Please select your locality.");
                } else {
                    setDeliveryMessage(
                        "Your locality is not listed. You can still submit a delivery request for admin verification."
                    );
                }
            } catch (error: any) {
                if (cancelled) return;

                setDeliveryMessage(
                    error.response?.data?.message ||
                    "Unable to check delivery availability."
                );
            } finally {
                if (!cancelled) {
                    setIsCheckingDelivery(false);
                }
            }
        };

        const timer = window.setTimeout(checkDelivery, 400);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [pincode, deliveryMethod]);
    

    const today = new Date();
    const minimumDate = new Date(today);
    minimumDate.setDate(today.getDate() + 4);

    const minDate = [
        minimumDate.getFullYear(),
        String(minimumDate.getMonth() + 1).padStart(2, "0"),
        String(minimumDate.getDate()).padStart(2, "0"),
    ].join("-");

    const morningTimes = [
        "8:00 AM",
        "9:00 AM",
        "10:00 AM",
        "11:00 AM",
        "12:00 PM",
    ];


    const eveningTimes = [
        "4:00 PM",
        "5:00 PM",
        "6:00 PM",
        "7:00 PM",
        "8:00 PM",
    ];

    const availableTimes =
        selectedSlot === "morning" ? morningTimes : eveningTimes;

    const validateBooking = () => {
        if (!customer.name.trim()) {
            return "Please enter your full name.";
        }

        if (!/^(?:\+91[\s-]?)?[6-9]\d{9}$/.test(customer.phone.trim())) {
            return "Please enter a valid phone number.";
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())) {
            return "Please enter a valid email address.";
        }
        if (!selectedSlot || !selectedTime) {
            return "Please select your preferred booking time.";
        }
        if (!bookingDate || bookingDate < minDate) {
            return "Please select a date at least 4 days ahead.";
        }

        if (deliveryMethod === "delivery") {
            if (!houseName.trim() || !street.trim() || !landmark.trim()) {
                return "Please complete your delivery address.";
            }

            if (!/^\d{6}$/.test(pincode.trim())) {
                return "Please enter a valid 6-digit PIN code.";
            }
        }

        return "";
    };


    const handleBookingSubmit = async () => {
        const error = validateBooking();

        if (error) {
            setFormError(error);
            return;
        }

        if (cartItems.length === 0) {
            setFormError("Your cart is empty.");
            return;
        }

        try {
            setIsSubmitting(true);
            setFormError("");

            const response = await API.post("/orders", {
                customerName: customer.name,
                customerEmail: customer.email,
                customerPhone: customer.phone,
                bookingDate,
                bookingSlot: selectedSlot,
                bookingTime: selectedTime,
                deliveryMethod,
                houseName,
                street,
                landmark,
                pincode,
                deliveryAreaId: deliveryMethod === "delivery" ? selectedAreaId : null,
                specialInstructions,
                cartItems: cartItems.map((item) => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                })),
            });

            alert(response.data.message);

            clearCart();

            navigate("/customer/dashboard");

        } catch (error: any) {
            setFormError(
                error.response?.data?.message ||
                "Unable to submit your booking. Please try again."
            );
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className="checkout-page">

            <header className="checkout-header">
                <Link to="/" className="checkout-brand">
                    Amma's Secrete Jar
                </Link>

                <nav>
                    <Link to="/">Home</Link>
                    <Link to="/shop">Shop</Link>
                    <Link to="/cart">My Cart</Link>
                </nav>
            </header>

            <section className="checkout-banner">
                <span>ALMOST THERE</span>
                <h1>Booking Details</h1>
                <p>Tell us when and how you would like to receive your order.</p>
            </section>

            <main className="checkout-content">

                {cartItems.length === 0 ? (
                    <div className="checkout-empty">
                        <h2>Your cart is empty</h2>
                        <p>Please add products before continuing.</p>
                        <Link to="/shop">Explore Products</Link>
                    </div>
                ) : (
                    <div className="checkout-layout">

                        <section className="checkout-form-section">

                            <div className="checkout-card">
                                <h2>Customer Information</h2>

                                <div className="checkout-form-group">
                                    <label htmlFor="customer-name">
                                        Full Name
                                    </label>
                                        <input
                                            id="customer-name"
                                            type="text"
                                            value={customer.name}
                                            onChange={(e) =>
                                                setCustomer({ ...customer, name: e.target.value })
                                            }
                                            placeholder="Enter your full name"
                                        />
                                </div>

                                <div className="checkout-form-group">
                                    <label htmlFor="customer-phone">
                                        Phone Number
                                    </label>
                                        <input
                                            id="customer-phone"
                                            type="tel"
                                            value={customer.phone}
                                            onChange={(e) =>
                                                setCustomer({ ...customer, phone: e.target.value })
                                            }
                                            placeholder="Enter your phone number"
                                        />
                                </div>

                                <div className="checkout-form-group">
                                    <label htmlFor="customer-email">
                                        Email Address
                                    </label>
                                    <input
                                        id="customer-email"
                                        type="email"
                                        value={customer.email}
                                        onChange={(e) =>
                                            setCustomer({ ...customer, email: e.target.value })
                                        }
                                        placeholder="Enter your email"
                                    />
                                </div>
                            </div>

                            <div className="checkout-card">
                                <h2>Booking Schedule</h2>

                                <div className="checkout-form-group">
                                    <label htmlFor="booking-date">
                                        Preferred Date
                                    </label>

                                    <input
                                        id="booking-date"
                                        type="date"
                                        min={minDate}
                                        value={bookingDate}
                                        onChange={(e) =>
                                            setBookingDate(e.target.value)
                                        }
                                    />

                                    <small>
                                        Please book at least 4 days in advance.
                                    </small>
                                </div>

                                <div className="checkout-form-group">
                                    <label>Select Time Slot</label>

                                    <div className="checkout-slot-options">
                                        <button
                                            type="button"
                                            className={
                                                selectedSlot === "morning"
                                                    ? "active"
                                                    : ""
                                            }
                                            onClick={() => {
                                                setSelectedSlot("morning");
                                                setSelectedTime("10:00");
                                            }}
                                        >
                                            Morning
                                        </button>

                                        <button
                                            type="button"
                                            className={
                                                selectedSlot === "evening"
                                                    ? "active"
                                                    : ""
                                            }
                                            onClick={() => {
                                                setSelectedSlot("evening");
                                                setSelectedTime("16:00");
                                            }}
                                        >
                                            Evening
                                        </button>
                                    </div>
                                </div>

                                <div className="checkout-form-group">
                                    <label htmlFor="booking-time">
                                        Preferred Time
                                    </label>

                                    <select
                                        id="booking-time"
                                        value={selectedTime}
                                        onChange={(e) =>
                                            setSelectedTime(e.target.value)
                                        }
                                    >
                                        {availableTimes.map((time) => (
                                            <option key={time} value={time}>
                                                {time}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="checkout-card">
                                <h2>Delivery Method</h2>

                                <div className="checkout-delivery-options">
                                    <label>
                                        <input
                                            type="radio"
                                            name="delivery"
                                            value="delivery"
                                            checked={deliveryMethod === "delivery"}
                                            onChange={() =>
                                                setDeliveryMethod("delivery")
                                            }
                                        />
                                        Home Delivery
                                    </label>

                                    <label>
                                        <input
                                            type="radio"
                                            name="delivery"
                                            value="pickup"
                                            checked={deliveryMethod === "pickup"}
                                            onChange={() =>
                                                setDeliveryMethod("pickup")
                                            }
                                        />
                                        Self Pickup
                                    </label>
                                </div>
                            </div>

                                {deliveryMethod === "delivery" && (
                                    <div className="checkout-card">
                                        <h2>Delivery Address</h2>

                                        <div className="checkout-form-group">
                                            <label htmlFor="house-name">
                                                House Name / Number
                                            </label>
                                            <input
                                                id="house-name"
                                                type="text"
                                                placeholder="Enter house name or number" value={houseName}
                                                onChange={(e) => setHouseName(e.target.value)}
                                            />
                                        </div>

                                        <div className="checkout-form-group">
                                            <label htmlFor="street">
                                                Street / Locality
                                            </label>
                                            <input
                                                id="street"
                                                type="text"
                                                placeholder="Enter street or locality" value={street}
                                                onChange={(e) => setStreet(e.target.value)}
                                            />
                                        </div>

                                        <div className="checkout-form-group">
                                            <label htmlFor="landmark">
                                                Nearby Landmark
                                            </label>
                                            <input
                                                id="landmark"
                                                type="text"
                                                placeholder="Enter nearby landmark" value={landmark}
                                                onChange={(e) => setLandmark(e.target.value)}
                                            />
                                        </div>

                                        <div className="checkout-form-group">
                                            <label htmlFor="pincode">
                                                PIN Code
                                            </label>
                                            <input
                                                id="pincode"
                                                type="text"
                                                maxLength={6}
                                                placeholder="Enter 6-digit PIN code" value={pincode}
                                                onChange={(e) => setPincode(e.target.value)}
                                            />
                                        </div>
                                        {isCheckingDelivery && (
                                            <p>Checking delivery availability...</p>
                                        )}

                                        {deliveryMessage && (
                                            <p className="delivery-message">
                                                {deliveryMessage}
                                            </p>
                                        )}

                                        {deliveryAreas.length > 1 && (
                                            <div className="checkout-form-group">
                                                <label htmlFor="delivery-area">
                                                    Select Your Locality
                                                </label>

                                                <select
                                                    id="delivery-area"
                                                    value={selectedAreaId}
                                                    onChange={(e) => {
                                                        const areaId = e.target.value;
                                                        setSelectedAreaId(areaId);

                                                        const area = deliveryAreas.find(
                                                            (item) => String(item.area_id) === areaId
                                                        );

                                                        setDeliveryCharge(
                                                            area ? Number(area.delivery_charge) : 0
                                                        );
                                                    }}
                                                >
                                                    <option value="">Choose your locality</option>

                                                    {deliveryAreas.map((area) => (
                                                        <option
                                                            key={area.area_id}
                                                            value={area.area_id}
                                                        >
                                                            {area.area_name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {deliveryAreas.length === 1 && (
                                            <p>
                                                Locality: <strong>{deliveryAreas[0].area_name}</strong>
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div className="checkout-card">
                                    <h2>Additional Instructions</h2>

                                    <div className="checkout-form-group">
                                        <label htmlFor="special-instructions">
                                            Special Requests (Optional)
                                        </label>

                                        <textarea
                                            id="special-instructions"
                                            rows={4}
                                            placeholder="Any special packing requests or delivery instructions..." value={specialInstructions}
                                            onChange={(e) => setSpecialInstructions(e.target.value)}
                                        />
                                    </div>
                                </div>

                        </section>

                        <aside className="checkout-summary">
                            <h2>Order Summary</h2>

                            {cartItems.map((item) => (
                                <div
                                    className="checkout-summary-item"
                                    key={item.product_id}
                                >
                                    <span>
                                        {item.product_name}
                                        <small>
                                            {item.quantity} {item.unit}
                                        </small>
                                    </span>

                                    <strong>
                                        ₹{item.total_price.toFixed(2)}
                                    </strong>
                                </div>
                            ))}

                                <div className="checkout-summary-total">
                                    <span>Delivery Charge</span>
                                    <strong>
                                        ₹{deliveryMethod === "delivery"
                                            ? deliveryCharge.toFixed(2)
                                            : "0.00"}
                                    </strong>
                                </div>

                                <div className="checkout-summary-total">
                                    <span>Estimated Total</span>
                                    <strong>
                                        ₹{(
                                            cartTotal +
                                            (deliveryMethod === "delivery" ? deliveryCharge : 0)
                                        ).toFixed(2)}
                                    </strong>
                                </div>

                            <p>
                                Your booking will be reviewed by our admin.
                                Payment will be requested only after approval.
                            </p>
                        </aside>
                            {formError && (
                                <p className="checkout-error" role="alert">
                                    {formError}
                                </p>
                            )}

                            <button
                                type="button"
                                className="checkout-submit-button"
                                onClick={handleBookingSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Submitting..." : "Submit Booking Request"}
                            </button>

                    </div>
                )}

            </main>

            <footer className="checkout-footer">
                © {new Date().getFullYear()} Amma's Secrete Jar. Made with love.
            </footer>

        </div>
    );
}

export default Checkout;
