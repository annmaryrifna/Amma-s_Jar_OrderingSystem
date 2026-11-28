
import { useEffect, useState } from "react";
import { Eye, X, RefreshCw } from "lucide-react";
import API from "../services/api";
import "./css/AdminComplaintReply.css";

interface Complaint {
    complaint_id: number;
    order_id: number;
    user_id: number;
    subject: string;
    category: string;
    complaint_message: string;
    admin_reply: string | null;
    complaint_status: "Pending" | "In Progress" | "Resolved";
    created_at: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
}

const AdminComplaintReply = () => {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [selectedComplaint, setSelectedComplaint] =
        useState<Complaint | null>(null);

    const [reply, setReply] = useState("");
    const [status, setStatus] =
        useState<Complaint["complaint_status"]>("Pending");

    const [saving, setSaving] = useState(false);

    const fetchComplaints = async () => {
        try {
            setError("");

            const response = await API.get("/admin/complaints");

            setComplaints(response.data.complaints || []);

        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Unable to load complaints."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, []);

    const handleViewComplaint = (complaint: Complaint) => {
        setSelectedComplaint(complaint);
        setReply(complaint.admin_reply || "");
        setStatus(complaint.complaint_status);
    };

    const handleSaveReply = async () => {
        if (!selectedComplaint) return;

        if (!reply.trim()) {
            alert("Please enter a reply before saving.");
            return;
        }

        try {
            setSaving(true);

            await API.put(
                `/admin/complaints/${selectedComplaint.complaint_id}`,
                {
                    adminReply: reply,
                    complaintStatus: status,
                }
            );

            alert("Complaint updated successfully.");

            setSelectedComplaint(null);

            await fetchComplaints();

        } catch (err: any) {
            alert(
                err.response?.data?.message ||
                "Unable to update complaint."
            );
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <div className="admin-complaints-page">

            {/* Page Header */}
            <div className="admin-complaints-header">
                <div>
                    <h1>Customer Complaints</h1>
                    <p>Review customer concerns and manage responses.</p>
                </div>

                <button
                    type="button"
                    className="refresh-complaints-button"
                    onClick={fetchComplaints}
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="admin-complaints-error">
                    {error}
                </div>
            )}

            {/* Complaints Table */}
            <div className="complaints-table-container">

                {loading ? (
                    <div className="complaints-empty-state">
                        Loading complaints...
                    </div>
                ) : complaints.length === 0 ? (
                    <div className="complaints-empty-state">
                        <h3>No Complaints Yet</h3>
                        <p>Customer complaints will appear here.</p>
                    </div>
                ) : (
                    <table className="complaints-table">
                        <thead>
                            <tr>
                                <th>Complaint ID</th>
                                <th>Customer</th>
                                <th>Booking</th>
                                <th>Category</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {complaints.map(complaint => (
                                <tr key={complaint.complaint_id}>
                                    <td>
                                        #{complaint.complaint_id}
                                    </td>

                                    <td>
                                        <div className="complaint-table-customer">
                                            <strong>
                                                {complaint.customer_name}
                                            </strong>
                                            <span>
                                                {complaint.customer_email}
                                            </span>
                                        </div>
                                    </td>

                                    <td>
                                        #{complaint.order_id}
                                    </td>

                                    <td>
                                        {complaint.category}
                                    </td>

                                    <td>
                                        {formatDate(complaint.created_at)}
                                    </td>

                                    <td>
                                        <span
                                            className={`complaint-status ${complaint.complaint_status
                                                .toLowerCase()
                                                .replace(" ", "-")}`}
                                        >
                                            {complaint.complaint_status}
                                        </span>
                                    </td>

                                    <td>
                                        <button
                                            type="button"
                                            className="view-complaint-button"
                                            onClick={() =>
                                                handleViewComplaint(complaint)
                                            }
                                        >
                                            <Eye size={15} />
                                            View & Reply
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Complaint Details Popup */}
            {selectedComplaint && (
                <div
                    className="complaint-details-overlay"
                    onClick={() => setSelectedComplaint(null)}
                >
                    <div
                        className="complaint-details-modal"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="complaint-details-header">
                            <div>
                                <h2>Complaint Details</h2>
                                <p>
                                    Complaint #{selectedComplaint.complaint_id}
                                    {" · "}
                                    Booking #{selectedComplaint.order_id}
                                </p>
                            </div>

                            <button
                                type="button"
                                className="complaint-modal-close"
                                onClick={() => setSelectedComplaint(null)}
                            >
                                <X size={21} />
                            </button>
                        </div>

                        <div className="complaint-details-body">

                            <section className="complaint-info-section">
                                <h3>Customer Details</h3>

                                <p>
                                    <strong>Name:</strong>{" "}
                                    {selectedComplaint.customer_name}
                                </p>

                                <p>
                                    <strong>Email:</strong>{" "}
                                    {selectedComplaint.customer_email}
                                </p>

                                <p>
                                    <strong>Phone:</strong>{" "}
                                    {selectedComplaint.customer_phone}
                                </p>
                            </section>

                            <section className="complaint-info-section">
                                <h3>Complaint Information</h3>

                                <p>
                                    <strong>Category:</strong>{" "}
                                    {selectedComplaint.category}
                                </p>

                                <p>
                                    <strong>Subject:</strong>{" "}
                                    {selectedComplaint.subject}
                                </p>

                                <p>
                                    <strong>Date:</strong>{" "}
                                    {formatDate(selectedComplaint.created_at)}
                                </p>

                                <div className="complaint-message-box">
                                    {selectedComplaint.complaint_message}
                                </div>
                            </section>

                            <section className="complaint-reply-section">
                                <h3>Manage Complaint</h3>

                                <label>Complaint Status</label>

                                <select
                                    value={status}
                                    onChange={e =>
                                        setStatus(
                                            e.target.value as Complaint["complaint_status"]
                                        )
                                    }
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="In Progress">
                                        In Progress
                                    </option>
                                    <option value="Resolved">Resolved</option>
                                </select>

                                <label>Private Reply to Customer</label>

                                <textarea
                                    value={reply}
                                    onChange={e => setReply(e.target.value)}
                                    placeholder="Write your reply to the customer..."
                                    rows={4}
                                />

                                <button
                                    type="button"
                                    className="save-complaint-reply"
                                    onClick={handleSaveReply}
                                    disabled={saving}
                                >
                                    {saving ? "Saving..." : "Save Reply"}
                                </button>
                            </section>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminComplaintReply;
