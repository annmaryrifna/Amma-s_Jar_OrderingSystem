
import { useEffect, useMemo, useState } from "react";
import API from "../services/api";
import "./css/AdminOrderManagement.css";

interface OrderItem {
    product_id: number;
    product_name: string;
    quantity: number;
    unit: string;
    price: number;
    total_price: number;
}

interface Order {
    order_id: number;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    booking_date: string;
    booking_slot: string;
    booking_time: string;
    delivery_method: string;
    
    house_name?: string;
    street?: string;
    landmark?: string;
    pincode?: string;
    special_instructions?: string;

    subtotal: number;
    discount_amount: number;
    discount_percentage?: number;
    delivery_charge?: number;
    total_amount: number;
    advance_amount: number;
    balance_amount: number;

    order_status: string;
    rejection_reason?: string;
    payment_status: string;

    items?: OrderItem[];
    order_items?: OrderItem[];
}

const formatBookingDate = (date: string) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
    });
};

const formatBookingTime = (time: string) => {
    if (!time) return "-";

    const [hours, minutes] = time.split(":");
    const hour = Number(hours);
    const period = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;

    return `${formattedHour}:${minutes} ${period}`;
};

const formatAmount = (amount: number) =>
    `₹${Number(amount || 0).toFixed(2)}`;

const AdminOrderManagement = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [paymentFilter, setPaymentFilter] = useState("All");
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [approvingId, setApprovingId] = useState<number | null>(null);
    const [rejectingOrder, setRejectingOrder] = useState<Order | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [rejecting, setRejecting] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setError("");

            const response = await API.get("/admin/orders");

            const orderData = Array.isArray(response.data)
                ? response.data
                : response.data.orders;

            setOrders(orderData || []);

            // Keep the details panel updated after refreshing.
            if (selectedOrder) {
                const updatedOrder = (orderData || []).find(
                    (order: Order) =>
                        order.order_id === selectedOrder.order_id
                );

                setSelectedOrder(updatedOrder || null);
            }
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Failed to load bookings."
            );
        } finally {
            setLoading(false);
        }
    };

    
    const counts = useMemo(() => ({
        total: orders.length,
        pending: orders.filter(
            order => order.order_status === "Pending Admin Approval"
        ).length,
        awaiting: orders.filter(
            order => order.order_status === "Approved – Awaiting Payment"
        ).length,
        confirmed: orders.filter(
            order => order.order_status === "Confirmed"
        ).length,
        completed: orders.filter(
            order => order.order_status === "Completed"
        ).length,
    }), [orders]);

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const searchText = search.toLowerCase();

            const matchesSearch =
                String(order.order_id).includes(searchText) ||
                order.customer_name.toLowerCase().includes(searchText) ||
                order.customer_email.toLowerCase().includes(searchText);

            const matchesStatus =
                statusFilter === "All" ||
                order.order_status === statusFilter;

            const matchesPayment =
                paymentFilter === "All" ||
                order.payment_status === paymentFilter;

            return matchesSearch && matchesStatus && matchesPayment;
        });
    }, [orders, search, statusFilter, paymentFilter]);


    const handleApprove = async (order: Order) => {
        const confirmed = window.confirm(
            `Are you sure you want to approve Booking #${order.order_id}?`
        );

        if (!confirmed) return;

        try {
            setApprovingId(order.order_id);
            setError("");

            let response;

            try {
                response = await API.put(
                    `/admin/orders/${order.order_id}/approve`
                );
            } catch (err: any) {
                // Check whether the daily booking limit was reached.
                if (
                    err.response?.status === 409 &&
                    err.response?.data?.requiresOverride
                ) {
                    const overrideConfirmed = window.confirm(
                        `${err.response.data.message}\n\n` +
                        `Daily limit: ${err.response.data.dailyBookingLimit}\n` +
                        `Already approved: ${err.response.data.usedBookings}\n\n` +
                        "Do you want to approve this booking anyway?"
                    );

                    if (!overrideConfirmed) return;

                    response = await API.put(
                        `/admin/orders/${order.order_id}/approve`,
                        { overrideDailyLimit: true }
                    );
                } else {
                    throw err;
                }
            }

            alert(
                response.data.message ||
                "Booking approved successfully."
            );

            await fetchOrders();
        } catch (err: any) {
            alert(
                err.response?.data?.message ||
                "Unable to approve this booking."
            );
        } finally {
            setApprovingId(null);
        }
    };

    
    const getStatusClass = (status: string) => {
        if (status === "Pending Admin Approval") return "pending";
        if (status === "Approved – Awaiting Payment") return "awaiting";
        if (status === "Confirmed") return "confirmed";
        if (status === "Completed") return "completed";
        if (status === "Rejected") return "rejected";

        return "default";
    };

    const getItems = (order: Order) =>
        order.items || order.order_items || [];

    if (loading) {
        return (
            <div className="order-loading">
                Loading bookings...
            </div>
        );
    }
    const handleReject = async () => {
        if (!rejectingOrder) return;

        if (!rejectionReason.trim()) {
            alert("Please enter a rejection reason.");
            return;
        }

        try {
            setRejecting(true);

            const response = await API.put(
                `/admin/orders/${rejectingOrder.order_id}/reject`,
                { reason: rejectionReason.trim() }
            );

            alert(response.data.message);

            setRejectingOrder(null);
            setRejectionReason("");

            await fetchOrders();
        } catch (error: any) {
            alert(
                error.response?.data?.message ||
                "Failed to reject booking."
            );
        } finally {
            setRejecting(false);
        }
    };
    return (
        <div className="admin-orders">

            <div className="orders-header">
                <div>
                    <h2>Order Management</h2>
                    <p>Manage customer bookings and payments.</p>
                </div>

                <button
                    className="refresh-button"
                    onClick={fetchOrders}
                >
                    Refresh
                </button>
            </div>

            {error && (
                <div className="orders-error">
                    {error}
                </div>
            )}

            {/* Summary Cards */}

            <div className="order-summary">

                <div className="summary-card">
                    <span>Total Bookings</span>
                    <h3>{counts.total}</h3>
                </div>

                <div className="summary-card pending-card">
                    <span>Pending Approval</span>
                    <h3>{counts.pending}</h3>
                </div>

                <div className="summary-card awaiting-card">
                    <span>Awaiting Payment</span>
                    <h3>{counts.awaiting}</h3>
                </div>

                <div className="summary-card confirmed-card">
                    <span>Confirmed</span>
                    <h3>{counts.confirmed}</h3>
                </div>

                <div className="summary-card completed-card">
                    <span>Completed</span>
                    <h3>{counts.completed}</h3>
                </div>

            </div>

            {/* Search and Filters */}

            <div className="order-filters">

                <input
                    type="text"
                    placeholder="Search booking ID, customer or email..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />

                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                >
                    <option value="All">All Order Statuses</option>
                    <option value="Pending Admin Approval">
                        Pending Admin Approval
                    </option>
                    <option value="Approved – Awaiting Payment">
                        Awaiting Payment
                    </option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Completed">Completed</option>
                    <option value="Rejected">Rejected</option>
                </select>

                <select
                    value={paymentFilter}
                    onChange={e => setPaymentFilter(e.target.value)}
                >
                    <option value="All">All Payment Statuses</option>
                    <option value="Not Paid">Not Paid</option>
                    <option value="Advance Payment Pending">
                        Advance Payment Pending
                    </option>
                    <option value="Advance Paid">Advance Paid</option>
                    <option value="Fully Paid">Fully Paid</option>
                </select>

            </div>

            {/* Bookings Table */}

            <div className="orders-table-container">

                <table className="orders-table">

                    <thead>
                        <tr>
                            <th>Booking ID</th>
                            <th>Customer</th>
                            <th>Booking Date</th>
                            <th>Time</th>
                            <th>Total Amount</th>
                            <th>Order Status</th>
                            <th>Payment Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>

                        {filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="no-orders">
                                    No bookings found.
                                </td>
                            </tr>
                        ) : (
                            filteredOrders.map(order => (

                                <tr key={order.order_id}>

                                    <td>
                                        <strong>#{order.order_id}</strong>
                                    </td>

                                    <td>
                                        <strong>{order.customer_name}</strong>
                                        <small>{order.customer_phone}</small>
                                    </td>

                                    <td>
                                        {formatBookingDate(order.booking_date)}
                                    </td>

                                    <td>
                                        {formatBookingTime(order.booking_time)}
                                    </td>

                                    <td>
                                        {formatAmount(order.total_amount)}
                                    </td>

                                    <td>
                                        <span className={`status-badge ${getStatusClass(order.order_status)}`}>
                                            {order.order_status}
                                        </span>
                                    </td>

                                    <td>
                                        <span className="payment-text">
                                            {order.payment_status}
                                        </span>
                                    </td>

                                    <td>
                                        <div className="order-actions">

                                            <button
                                                className="view-button"
                                                onClick={() => setSelectedOrder(order)}
                                            >
                                                View
                                            </button>

                                            {order.order_status === "Pending Admin Approval" && (
                                                <>
                                                    <button
                                                        className="approve-button"
                                                        onClick={() => handleApprove(order)}
                                                        disabled={approvingId === order.order_id}
                                                    >
                                                        {approvingId === order.order_id
                                                            ? "Approving..."
                                                            : "Approve"}
                                                    </button>

                                                    <button
                                                        className="reject-button"
                                                        onClick={() => {
                                                            setRejectingOrder(order);
                                                            setRejectionReason("");
                                                        }}
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}

                                        </div>
                                    </td>

                                </tr>

                            ))
                        )}

                    </tbody>

                </table>

            </div>

            {/* Booking Details Panel */}

            {selectedOrder && (

                <div
                    className="order-modal-overlay"
                    onClick={() => setSelectedOrder(null)}
                >

                    <div
                        className="order-modal"
                        onClick={e => e.stopPropagation()}
                    >

                        <div className="modal-header">
                            <div>
                                <h3>
                                    Booking #{selectedOrder.order_id}
                                </h3>
                                <p>Customer booking details</p>
                            </div>

                            <button
                                className="close-button"
                                onClick={() => setSelectedOrder(null)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="modal-section">
                            <h4>Customer Information</h4>

                            <p><strong>Name:</strong> {selectedOrder.customer_name}</p>
                            <p><strong>Email:</strong> {selectedOrder.customer_email}</p>
                            <p><strong>Phone:</strong> {selectedOrder.customer_phone}</p>
                        </div>

                        <div className="modal-section">
                            <h4>Booking Information</h4>

                            <p>
                                <strong>Date:</strong>{" "}
                                {formatBookingDate(selectedOrder.booking_date)}
                            </p>

                            <p>
                                <strong>Slot:</strong>{" "}
                                {selectedOrder.booking_slot}
                            </p>

                            <p>
                                <strong>Time:</strong>{" "}
                                {formatBookingTime(selectedOrder.booking_time)}
                            </p>

                            <p>
                                <strong>Delivery Method:</strong>{" "}
                                {selectedOrder.delivery_method}
                            </p>
                        </div>

                        {selectedOrder.delivery_method === "delivery" && (
                            <div className="modal-section">
                                <h4>Delivery Address</h4>

                                <p>{selectedOrder.house_name}</p>
                                <p>{selectedOrder.street}</p>
                                <p>{selectedOrder.landmark}</p>
                                <p>{selectedOrder.pincode}</p>
                            </div>
                        )}

                        {selectedOrder.special_instructions && (
                            <div className="modal-section">
                                <h4>Special Instructions</h4>
                                <p>{selectedOrder.special_instructions}</p>
                            </div>
                        )}

                        <div className="modal-section">
                            <h4>Ordered Products</h4>

                            {getItems(selectedOrder).length === 0 ? (
                                <p>Product details are not available.</p>
                            ) : (
                                <div className="modal-items">

                                    {getItems(selectedOrder).map((item, index) => (
                                        <div
                                            className="modal-item"
                                            key={`${item.product_id}-${index}`}
                                        >
                                            <div>
                                                <strong>{item.product_name}</strong>
                                                <small>
                                                    Quantity: {item.quantity} {item.unit}
                                                </small>
                                            </div>

                                            <strong>
                                                {formatAmount(item.total_price)}
                                            </strong>
                                        </div>
                                    ))}

                                </div>
                            )}
                        </div>

                        <div className="modal-section payment-summary">
                            <h4>Payment Summary</h4>

                            <p>
                                <span>Subtotal</span>
                                <strong>{formatAmount(selectedOrder.subtotal)}</strong>
                            </p>

                            <p>
                                <span>Discount</span>
                                <strong>
                                    - {formatAmount(selectedOrder.discount_amount)}
                                </strong>
                            </p>

                            <p>
                                <span>Delivery Charge</span>
                                <strong>
                                    {formatAmount(selectedOrder.delivery_charge || 0)}
                                </strong>
                            </p>

                            <p className="total-line">
                                <span>Total Amount</span>
                                <strong>{formatAmount(selectedOrder.total_amount)}</strong>
                            </p>

                            <p>
                                <span>40% Advance</span>
                                <strong>{formatAmount(selectedOrder.advance_amount)}</strong>
                            </p>

                            <p>
                                <span>Remaining Balance</span>
                                <strong>{formatAmount(selectedOrder.balance_amount)}</strong>
                            </p>
                        </div>

                        <div className="modal-section">
                            <h4>Current Status</h4>

                            <p>
                                <strong>Order:</strong>{" "}
                                {selectedOrder.order_status}
                            </p>

                            <p>
                                <strong>Payment:</strong>{" "}
                                {selectedOrder.payment_status}
                            </p>
                        </div>
                        {selectedOrder.order_status === "Rejected" &&
                            selectedOrder.rejection_reason && (
                                <div className="modal-section">
                                    <h4>Rejection Reason</h4>
                                    <p>{selectedOrder.rejection_reason}</p>
                                </div>
                            )}
                        {selectedOrder.order_status === "Pending Admin Approval" && (
                            <div className="modal-actions">
                                <button
                                    className="approve-button"
                                    onClick={() => handleApprove(selectedOrder)}
                                    disabled={approvingId === selectedOrder.order_id}
                                >
                                    {approvingId === selectedOrder.order_id
                                        ? "Approving..."
                                        : "Approve Booking"}
                                </button>
                            </div>
                        )}

                    </div>

                </div>

            )}
            {rejectingOrder && (
                <div
                    className="order-modal-overlay"
                    onClick={() => {
                        if (!rejecting) {
                            setRejectingOrder(null);
                        }
                    }}
                >
                    <div
                        className="order-modal rejection-modal"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <div>
                                <h3>Reject Booking #{rejectingOrder.order_id}</h3>
                                <p>
                                    Customer: {rejectingOrder.customer_name}
                                </p>
                            </div>

                            <button
                                className="close-button"
                                disabled={rejecting}
                                onClick={() => setRejectingOrder(null)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="modal-section">
                            <label htmlFor="rejectionReason">
                                Reason for rejection
                            </label>

                            <textarea
                                id="rejectionReason"
                                value={rejectionReason}
                                onChange={e => setRejectionReason(e.target.value)}
                                placeholder="Enter the reason for rejecting this booking..."
                                maxLength={500}
                                rows={4}
                                disabled={rejecting}
                            />

                            <small>
                                {rejectionReason.length}/500 characters
                            </small>
                        </div>

                        <div className="modal-actions">
                            <button
                                className="view-button"
                                disabled={rejecting}
                                onClick={() => setRejectingOrder(null)}
                            >
                                Cancel
                            </button>

                            <button
                                className="reject-button"
                                disabled={rejecting || !rejectionReason.trim()}
                                onClick={handleReject}
                            >
                                {rejecting ? "Rejecting..." : "Confirm Rejection"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminOrderManagement;
