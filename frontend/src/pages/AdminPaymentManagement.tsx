
import { useEffect, useState } from "react";
import API from "../services/api";
import "./css/AdminPaymentManagement.css";

interface Payment {
    payment_id: number;
    order_id: number;
    payment_type: string;
    payment_method: string;
    amount: number;
    transaction_reference: string;
    verification_status: string;
    admin_note?: string;
    submitted_at: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    order_status: string;
    payment_status: string;
}

const AdminPaymentManagement = () => {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("All");
    const [search, setSearch] = useState("");
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [rejectingPayment, setRejectingPayment] =
        useState<Payment | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");

    const fetchPayments = async () => {
        try {
            setError("");

            const response = await API.get("/admin/payments");
            setPayments(response.data.payments || []);
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Failed to load payment submissions."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    const handleVerify = async (payment: Payment) => {
        const confirmed = window.confirm(
            `Have you checked your UPI/bank account and confirmed receipt of ₹${Number(payment.amount).toFixed(2)} for Booking #${payment.order_id}?`
        );

        if (!confirmed) return;

        try {
            setProcessingId(payment.payment_id);

            const response = await API.put(
                `/admin/payments/${payment.payment_id}/verify`
            );

            alert(response.data.message);
            await fetchPayments();
        } catch (err: any) {
            alert(
                err.response?.data?.message ||
                "Unable to verify payment."
            );
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async () => {
        if (!rejectingPayment || !rejectionReason.trim()) {
            alert("Please enter a rejection reason.");
            return;
        }

        try {
            setProcessingId(rejectingPayment.payment_id);

            const response = await API.put(
                `/admin/payments/${rejectingPayment.payment_id}/reject`,
                { reason: rejectionReason.trim() }
            );

            alert(response.data.message);

            setRejectingPayment(null);
            setRejectionReason("");

            await fetchPayments();
        } catch (err: any) {
            alert(
                err.response?.data?.message ||
                "Unable to reject payment."
            );
        } finally {
            setProcessingId(null);
        }
    };

    const counts = {
        total: payments.length,
        pending: payments.filter(
            p => p.verification_status === "Pending"
        ).length,
        verified: payments.filter(
            p => p.verification_status === "Verified"
        ).length,
        rejected: payments.filter(
            p => p.verification_status === "Rejected"
        ).length,
    };

    const filteredPayments = payments.filter(payment => {
        const matchesFilter =
            filter === "All" ||
            payment.verification_status === filter;

        const searchText = search.toLowerCase();

        const matchesSearch =
            String(payment.order_id).includes(searchText) ||
            String(payment.payment_id).includes(searchText) ||
            payment.customer_name.toLowerCase().includes(searchText) ||
            payment.transaction_reference.toLowerCase().includes(searchText);

        return matchesFilter && matchesSearch;
    });

    // const formatDate = (date: string) => {
    //     return new Date(date).toLocaleString("en-IN", {
    //         day: "2-digit",
    //         month: "short",
    //         year: "numeric",
    //         hour: "2-digit",
    //         minute: "2-digit",
    //     });
    // };

    if (loading) {
        return <p className="payment-loading">Loading payments...</p>;
    }

    return (
        <div className="admin-payments">

            <div className="admin-payments-header">
                <div>
                    <h2>Payment Management</h2>
                    <p>Review and verify customer payments.</p>
                </div>

                <button
                    className="payment-refresh-button"
                    onClick={fetchPayments}
                >
                    Refresh
                </button>
            </div>

            {error && (
                <div className="payment-error">{error}</div>
            )}

            {/* Summary Cards */}

            <div className="payment-summary-cards">

                <div className="payment-summary-card">
                    <span>Total Submissions</span>
                    <h3>{counts.total}</h3>
                </div>

                <div className="payment-summary-card">
                    <span>Pending Verification</span>
                    <h3>{counts.pending}</h3>
                </div>

                <div className="payment-summary-card">
                    <span>Verified</span>
                    <h3>{counts.verified}</h3>
                </div>

                <div className="payment-summary-card">
                    <span>Rejected</span>
                    <h3>{counts.rejected}</h3>
                </div>

            </div>

            {/* Search and Filter */}

            <div className="payment-filters">

                <input
                    type="text"
                    placeholder="Search booking, customer or UTR..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />

                <select
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                >
                    <option value="All">All Payments</option>
                    <option value="Pending">Pending</option>
                    <option value="Verified">Verified</option>
                    <option value="Rejected">Rejected</option>
                </select>

            </div>

            {/* Payments Table */}

            <div className="payment-table-container">

                <table className="payment-table">

                    <thead>
                        <tr>
                            <th>Payment ID</th>
                            <th>Booking ID</th>
                            <th>Customer</th>
                            <th>Payment Type</th>
                            <th>Method</th>
                            <th>Amount</th>
                            <th>Transaction Reference</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>

                    <tbody>

                        {filteredPayments.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="no-payments">
                                    No payment submissions found.
                                </td>
                            </tr>
                        ) : (
                            filteredPayments.map(payment => (

                                <tr key={payment.payment_id}>

                                    <td>#{payment.payment_id}</td>

                                    <td>#{payment.order_id}</td>

                                    <td>
                                        <strong>{payment.customer_name}</strong>
                                        <small>{payment.customer_phone}</small>
                                    </td>

                                    <td>
                                        {payment.payment_type === "advance"
                                            ? "Advance"
                                            : "Balance"}
                                    </td>

                                    <td>
                                        {payment.payment_method === "upi_id"
                                            ? "UPI ID"
                                            : "UPI QR"}
                                    </td>

                                    <td>
                                        <strong>
                                            ₹{Number(payment.amount).toFixed(2)}
                                        </strong>
                                    </td>

                                    <td className="transaction-reference-cell">
                                        {payment.transaction_reference}
                                    </td>

                                    <td>
                                        <span className={`payment-status-badge ${payment.verification_status.toLowerCase()}`}>
                                            {payment.verification_status}
                                        </span>
                                    </td>

                                    <td>
                                        {payment.verification_status === "Pending" ? (
                                            <div className="payment-actions">

                                                <button
                                                    className="verify-payment-button"
                                                    disabled={processingId === payment.payment_id}
                                                    onClick={() => handleVerify(payment)}
                                                >
                                                    Verify
                                                </button>

                                                <button
                                                    className="reject-payment-button"
                                                    disabled={processingId === payment.payment_id}
                                                    onClick={() => {
                                                        setRejectingPayment(payment);
                                                        setRejectionReason("");
                                                    }}
                                                >
                                                    Reject
                                                </button>

                                            </div>
                                        ) : (
                                            <span className="processed-text">
                                                Processed
                                            </span>
                                        )}
                                    </td>

                                </tr>

                            ))
                        )}

                    </tbody>

                </table>

            </div>

            <p className="payment-submission-info">
                Submitted payments must be checked against the actual
                transaction in your UPI app or bank account before verification.
            </p>

            {/* Rejection Modal */}

            {rejectingPayment && (

                <div
                    className="payment-modal-overlay"
                    onClick={() => {
                        if (processingId === null) {
                            setRejectingPayment(null);
                        }
                    }}
                >

                    <div
                        className="payment-rejection-modal"
                        onClick={e => e.stopPropagation()}
                    >

                        <h3>
                            Reject Payment #{rejectingPayment.payment_id}
                        </h3>

                        <p>
                            Booking #{rejectingPayment.order_id} —
                            {rejectingPayment.customer_name}
                        </p>

                        <label>Reason for rejection</label>

                        <textarea
                            value={rejectionReason}
                            onChange={e => setRejectionReason(e.target.value)}
                            placeholder="Enter the reason..."
                            maxLength={500}
                            rows={4}
                        />

                        <div className="payment-modal-actions">

                            <button
                                className="payment-cancel-button"
                                disabled={processingId !== null}
                                onClick={() => setRejectingPayment(null)}
                            >
                                Cancel
                            </button>

                            <button
                                className="reject-payment-button"
                                disabled={
                                    processingId !== null ||
                                    !rejectionReason.trim()
                                }
                                onClick={handleReject}
                            >
                                {processingId === rejectingPayment.payment_id
                                    ? "Rejecting..."
                                    : "Confirm Rejection"}
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
};

export default AdminPaymentManagement;
