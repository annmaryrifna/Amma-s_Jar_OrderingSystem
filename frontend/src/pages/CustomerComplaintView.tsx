
import { useEffect, useState } from "react";
import API from "../services/api";
import "./css/CustomerComplaintView.css";

interface CustomerComplaint {
    complaint_id: number;
    order_id: number;
    subject: string;
    category: string;
    complaint_message: string;
    admin_reply: string | null;
    complaint_status: "Pending" | "In Progress" | "Resolved";
    created_at: string;
    updated_at: string;
}

const CustomerComplaintView = () => {
    const [complaints, setComplaints] =
        useState<CustomerComplaint[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchComplaints = async () => {
        try {
            setError("");

            const response = await API.get(
                "/complaints/my-complaints"
            );

            setComplaints(response.data.complaints || []);

        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Unable to load your complaints."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, []);

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    if (loading) {
        return (
            <div className="customer-complaints-loading">
                Loading your complaints...
            </div>
        );
    }

    return (
        <main className="customer-complaints-page">

            <div className="customer-complaints-header">
                <div>
                    <span>YOUR ACCOUNT</span>
                    <h1>My Complaints</h1>
                    <p>
                        View your complaints and responses from our team.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={fetchComplaints}
                    className="refresh-customer-complaints"
                >
                    Refresh
                </button>
            </div>

            {error && (
                <div className="customer-complaints-error">
                    {error}
                </div>
            )}

            {complaints.length === 0 ? (
                <div className="no-customer-complaints">
                    <h3>No Complaints Found</h3>
                    <p>
                        You haven't submitted any complaints yet.
                    </p>
                </div>
            ) : (
                <div className="customer-complaints-list">
                    {complaints.map(complaint => (
                        <article
                            className="customer-complaint-card"
                            key={complaint.complaint_id}
                        >
                            <div className="customer-complaint-header">
                                <div>
                                    <h3>
                                        Complaint #{complaint.complaint_id}
                                    </h3>
                                    <p>
                                        Booking #{complaint.order_id}
                                    </p>
                                </div>

                                <span
                                    className={`customer-complaint-status ${complaint.complaint_status
                                        .toLowerCase()
                                        .replace(" ", "-")}`}
                                >
                                    {complaint.complaint_status}
                                </span>
                            </div>

                            <div className="customer-complaint-details">
                                <p>
                                    <strong>Category:</strong>{" "}
                                    {complaint.category}
                                </p>

                                <p>
                                    <strong>Subject:</strong>{" "}
                                    {complaint.subject}
                                </p>

                                <p>
                                    <strong>Submitted:</strong>{" "}
                                    {formatDate(complaint.created_at)}
                                </p>

                                <h4>Your Complaint</h4>

                                <div className="customer-complaint-message">
                                    {complaint.complaint_message}
                                </div>
                            </div>

                            <div className="customer-admin-reply">
                                <h4>Response from Amma's Secrete Jar</h4>

                                {complaint.admin_reply ? (
                                    <p>{complaint.admin_reply}</p>
                                ) : (
                                    <p className="reply-pending-message">
                                        Your complaint is being reviewed.
                                        We'll respond as soon as possible.
                                    </p>
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </main>
    );
};

export default CustomerComplaintView;
