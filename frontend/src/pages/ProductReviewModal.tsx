
import { useState } from "react";
import "./css/ProductReviewModal.css";

interface ReviewProduct {
    product_id: number;
    product_name: string;
    quantity: number;
    unit: string;
    product_image: string | null;
}
interface ExistingReview {
    product_id: number;
    rating: number;
    review_text: string | null;
}
interface ProductReviewModalProps {
    orderId: number;
    products: ReviewProduct[];
    existingReviews: ExistingReview[];
    onClose: () => void;
    onSubmit: (
        orderId: number,
        productId: number,
        rating: number,
        reviewText: string
    ) => Promise<void>;
}

const ProductReviewModal = ({
    orderId,
    products,
    existingReviews,
    onClose,
    onSubmit,
}: ProductReviewModalProps) => {

    const [ratings, setRatings] = useState<Record<number, number>>({});

    const [reviewTexts, setReviewTexts] =
        useState<Record<number, string>>({});

    const [submittingProduct, setSubmittingProduct] =
        useState<number | null>(null);

    const [submittedProducts, setSubmittedProducts] =
        useState<number[]>(
            existingReviews.map(review => review.product_id)
        );

    const handleSubmit = async (productId: number) => {
        if (!ratings[productId]) {
            alert("Please select a star rating.");
            return;
        }

        try {
            setSubmittingProduct(productId);

            await onSubmit(
                orderId,
                productId,
                ratings[productId],
                reviewTexts[productId] || ""
            );

            setSubmittedProducts(previous => [
                ...previous,
                productId,
            ]);

        } finally {
            setSubmittingProduct(null);
        }
    };
    return (
        <div className="review-modal-overlay" onClick={onClose}>
            <div
                className="review-modal"
                onClick={e => e.stopPropagation()}
            >
                <div className="review-modal-header">
                    <div>
                        <h2>Share Your Experience</h2>
                        <p>Booking #{orderId}</p>
                    </div>

                    <button
                        type="button"
                        className="review-close-button"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                <div className="review-modal-body">
                    {products.map(product => (
                        <div
                            className="review-product-card"
                            key={product.product_id}
                        >
                            <div className="review-product-info">
                                {product.product_image ? (
                                    <img
                                        src={`http://localhost:5000${product.product_image}`}
                                        alt={product.product_name}
                                    />
                                ) : (
                                    <div className="review-no-image">
                                        No Image
                                    </div>
                                )}

                                <div>
                                    <h3>{product.product_name}</h3>
                                    <p>
                                        {product.quantity} {product.unit}
                                    </p>
                                </div>
                            </div>

                            <label>Rate this product</label>

                            <div className="review-stars">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        type="button"
                                        key={star}
                                        className={
                                            star <= (ratings[product.product_id] || 0)
                                                ? "active"
                                                : ""
                                        }
                                        onClick={() =>
                                            setRatings(previous => ({
                                                ...previous,
                                                [product.product_id]: star,
                                            }))
                                        }
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>

                            <label>Write your review</label>

                            <textarea
                                value={reviewTexts[product.product_id] || ""}
                                onChange={e =>
                                    setReviewTexts(previous => ({
                                        ...previous,
                                        [product.product_id]: e.target.value,
                                    }))
                                }
                                placeholder="Share what you liked about this product..."
                                rows={3}
                            />


                            {submittedProducts.includes(product.product_id) ? (
                                <div className="review-success-message">
                                    <strong>✓ Thank you for your review!</strong>
                                    <p>We appreciate you sharing your experience with us.</p>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    className="submit-review-button"
                                    onClick={() => handleSubmit(product.product_id)}
                                    disabled={submittingProduct === product.product_id}
                                >
                                    {submittingProduct === product.product_id
                                        ? "Submitting..."
                                        : "Submit Review"}
                                </button>
                            )}

                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProductReviewModal;
