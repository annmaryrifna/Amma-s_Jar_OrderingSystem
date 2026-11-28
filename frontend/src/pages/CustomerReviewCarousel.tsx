
import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import API from "../services/api";
import "./css/CustomerReviewCarousel.css";

interface ProductReview {
    review_id: number;
    product_id: number;
    rating: number;
    review_text: string;
    created_at: string;
    customer_name: string;
    product_name: string;
    product_image: string | null;
}

function CustomerReviewCarousel() {
    const [reviews, setReviews] = useState<ProductReview[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const response = await API.get("/reviews/approved");
                setReviews(response.data.reviews || []);
            } catch (error) {
                console.error("Failed to fetch customer reviews:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, []);

    if (loading) return null;
    if (reviews.length === 0) return null;

    return (
        <section className="customer-reviews-section">
            <div className="section-heading">
                <span className="eyebrow">KIND WORDS FROM OUR CUSTOMERS</span>
                <h2>Made with Love, Loved by You</h2>
                <p>Every review makes our homemade journey special.</p>
            </div>

            <div className="customer-reviews-grid">
                {reviews.map((review) => (
                    <div className="customer-review-card" key={review.review_id}>
                        {review.product_image && (
                            <div className="review-product-image">
                                <img
                                    src={`http://localhost:5000${review.product_image}`}
                                    alt={review.product_name}
                                />
                            </div>
                        )}
                        <div className="review-stars">
                            {Array.from({ length: 5 }, (_, index) => (
                                <Star
                                    key={index}
                                    size={17}
                                    fill={index < review.rating ? "currentColor" : "none"}
                                />
                            ))}
                        </div>

                        <p className="review-message">
                            "{review.review_text}"
                        </p>

                        <div className="review-customer">
                            <strong>{review.customer_name}</strong>
                            <span>Purchased: {review.product_name}</span>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default CustomerReviewCarousel;
