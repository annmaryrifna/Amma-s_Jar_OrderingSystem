
import { useEffect, useState } from "react";
import { Eye, X, RefreshCw, Star } from "lucide-react";
import API from "../services/api";
import "./css/AdminReviewManagement.css";

interface ProductReview {
    review_id: number;
    order_id: number;
    product_id: number;
    user_id: number;
    rating: number;
    review_text: string | null;
    is_approved: number | boolean;
    created_at: string;
    customer_name: string;
    product_name: string;
    product_image: string | null;
}

const AdminReviewManagement = () => {
    const [reviews, setReviews] = useState<ProductReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [selectedReview, setSelectedReview] =
        useState<ProductReview | null>(null);

    const [saving, setSaving] = useState(false);

    const fetchReviews = async () => {
        try {
            setError("");

            const response = await API.get("/reviews/admin/all");

            setReviews(response.data.reviews || []);

        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Unable to load product reviews."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const handleUpdateReview = async (isApproved: boolean) => {
        if (!selectedReview) return;

        try {
            setSaving(true);

            await API.put(
                `/reviews/admin/${selectedReview.review_id}`,
                { isApproved }
            );

            alert(
                isApproved
                    ? "Review approved successfully."
                    : "Review rejected successfully."
            );

            setSelectedReview(null);
            await fetchReviews();

        } catch (err: any) {
            alert(
                err.response?.data?.message ||
                "Unable to update review."
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
        <div className="admin-reviews-page">

            {/* Page Header */}
            <div className="admin-reviews-header">
                <div>
                    <h1>Product Reviews</h1>
                    <p>Review customer feedback and manage approvals.</p>
                </div>

                <button
                    type="button"
                    className="refresh-reviews-button"
                    onClick={fetchReviews}
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="admin-reviews-error">
                    {error}
                </div>
            )}

            {/* Reviews Table */}
            <div className="reviews-table-container">

                {loading ? (
                    <div className="reviews-empty-state">
                        Loading reviews...
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="reviews-empty-state">
                        <h3>No Reviews Yet</h3>
                        <p>Customer product reviews will appear here.</p>
                    </div>
                ) : (
                    <table className="reviews-table">
                        <thead>
                            <tr>
                                <th>Review ID</th>
                                <th>Customer</th>
                                <th>Product</th>
                                <th>Rating</th>
                                <th>Date</th>
                                <th>Approval</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {reviews.map(review => (
                                <tr key={review.review_id}>
                                    <td>#{review.review_id}</td>

                                    <td>{review.customer_name}</td>

                                    <td>{review.product_name}</td>

                                    <td>
                                        <span className="review-rating">
                                            <Star size={14} fill="currentColor" />
                                            {review.rating}/5
                                        </span>
                                    </td>

                                    <td>{formatDate(review.created_at)}</td>

                                    <td>
                                        <span
                                            className={`review-approval-status ${review.is_approved
                                                    ? "approved"
                                                    : "pending"
                                                }`}
                                        >
                                            {review.is_approved
                                                ? "Approved"
                                                : "Pending"}
                                        </span>
                                    </td>

                                    <td>
                                        <button
                                            type="button"
                                            className="view-review-button"
                                            onClick={() =>
                                                setSelectedReview(review)
                                            }
                                        >
                                            <Eye size={15} />
                                            View Review
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Review Details Popup */}
            {selectedReview && (
                <div
                    className="review-details-overlay"
                    onClick={() => setSelectedReview(null)}
                >
                    <div
                        className="review-details-modal"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="review-details-header">
                            <div>
                                <h2>Review Details</h2>
                                <p>
                                    Review #{selectedReview.review_id}
                                </p>
                            </div>

                            <button
                                type="button"
                                className="review-modal-close"
                                onClick={() => setSelectedReview(null)}
                            >
                                <X size={21} />
                            </button>
                        </div>

                        <div className="review-details-body">

                            <div className="review-product-info">
                                {selectedReview.product_image ? (
                                    <img
                                        src={`http://localhost:5000${selectedReview.product_image}`}
                                        alt={selectedReview.product_name}
                                    />
                                ) : (
                                    <div className="review-product-no-image">
                                        No Image
                                    </div>
                                )}

                                <div>
                                    <h3>{selectedReview.product_name}</h3>
                                    <p>
                                        Booking #{selectedReview.order_id}
                                    </p>
                                </div>
                            </div>

                            <div className="review-customer-details">
                                <p>
                                    <strong>Customer:</strong>{" "}
                                    {selectedReview.customer_name}
                                </p>

                                <p>
                                    <strong>Submitted:</strong>{" "}
                                    {formatDate(selectedReview.created_at)}
                                </p>
                            </div>

                            <div className="review-rating-details">
                                <strong>Customer Rating</strong>

                                <div>
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <Star
                                            key={star}
                                            size={22}
                                            fill={
                                                star <= selectedReview.rating
                                                    ? "#D49A36"
                                                    : "none"
                                            }
                                            color="#D49A36"
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="review-text-details">
                                <strong>Customer Review</strong>
                                <p>
                                    {selectedReview.review_text ||
                                        "No written comment provided."}
                                </p>
                            </div>

                            <div className="review-approval-actions">
                                {selectedReview.is_approved ? (
                                    <button
                                        type="button"
                                        className="reject-review-button"
                                        onClick={() =>
                                            handleUpdateReview(false)
                                        }
                                        disabled={saving}
                                    >
                                        {saving
                                            ? "Updating..."
                                            : "Reject Review"}
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            className="reject-review-button"
                                            onClick={() =>
                                                handleUpdateReview(false)
                                            }
                                            disabled={saving}
                                        >
                                            Reject
                                        </button>

                                        <button
                                            type="button"
                                            className="approve-review-button"
                                            onClick={() =>
                                                handleUpdateReview(true)
                                            }
                                            disabled={saving}
                                        >
                                            {saving
                                                ? "Updating..."
                                                : "Approve Review"}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminReviewManagement;
