
import { Request, Response } from "express";
import pool from "../config/db.js";
import { RowDataPacket, ResultSetHeader } from "mysql2";

// Submit an individual product review
export const submitProductReview = async (
    req: Request,
    res: Response
) => {
    try {
        const userId = (req as any).user.id;

        const { orderId, productId, rating, reviewText } = req.body;

        // Validate required fields
        if (!orderId || !productId || !rating) {
            return res.status(400).json({
                message: "Booking, product and rating are required.",
            });
        }

        const numericRating = Number(rating);

        if (
            !Number.isInteger(numericRating) ||
            numericRating < 1 ||
            numericRating > 5
        ) {
            return res.status(400).json({
                message: "Rating must be between 1 and 5.",
            });
        }

        // Check whether the booking belongs to this customer
        // and has been completed
        const [orders] = await pool.query<RowDataPacket[]>(
            `SELECT order_id
             FROM orders
             WHERE order_id = ?
               AND user_id = ?
               AND order_status = 'Completed'`,
            [orderId, userId]
        );

        if (orders.length === 0) {
            return res.status(403).json({
                message: "You can review products only from your completed bookings.",
            });
        }

        // Check whether the product belongs to this booking
        const [items] = await pool.query<RowDataPacket[]>(
            `SELECT product_id
             FROM order_items
             WHERE order_id = ?
               AND product_id = ?`,
            [orderId, productId]
        );

        if (items.length === 0) {
            return res.status(400).json({
                message: "This product does not belong to the selected booking.",
            });
        }

        // Save the review
        await pool.query<ResultSetHeader>(
            `INSERT INTO product_reviews
                (order_id, product_id, user_id, rating, review_text)
             VALUES (?, ?, ?, ?, ?)`,
            [
                orderId,
                productId,
                userId,
                numericRating,
                reviewText?.trim() || null,
            ]
        );

        return res.status(201).json({
            message: "Your review has been submitted for admin approval.",
        });

    } catch (error: any) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "You have already reviewed this product in this booking.",
            });
        }

        console.error("Submit product review error:", error);

        return res.status(500).json({
            message: "Unable to submit your review.",
        });
    }
};

// Get reviews submitted by the logged-in customer
export const getMyProductReviews = async (
    req: Request,
    res: Response
) => {
    try {
        const userId = (req as any).user.id;

        const [reviews] = await pool.query<RowDataPacket[]>(
            `SELECT
                review_id,
                order_id,
                product_id,
                rating,
                review_text,
                is_approved,
                created_at
             FROM product_reviews
             WHERE user_id = ?
             ORDER BY created_at DESC`,
            [userId]
        );

        return res.status(200).json({
            message: "Your reviews retrieved successfully.",
            reviews,
        });

    } catch (error) {
        console.error("Get customer reviews error:", error);

        return res.status(500).json({
            message: "Unable to retrieve your reviews.",
        });
    }
};

// Get all product reviews for admin management
export const getAllProductReviews = async (
    req: Request,
    res: Response
) => {
    try {
        const [reviews] = await pool.query<RowDataPacket[]>(
            `SELECT
                r.review_id,
                r.order_id,
                r.product_id,
                r.user_id,
                r.rating,
                r.review_text,
                r.is_approved,
                r.created_at,
                u.name AS customer_name,
                p.product_name,
                p.image AS product_image
             FROM product_reviews r
             JOIN users u ON r.user_id = u.id
             JOIN products p ON r.product_id = p.product_id
             ORDER BY r.created_at DESC`
        );

        return res.status(200).json({
            message: "Product reviews retrieved successfully.",
            reviews,
        });

    } catch (error) {
        console.error("Get all product reviews error:", error);

        return res.status(500).json({
            message: "Unable to retrieve product reviews.",
        });
    }
};

export const updateProductReviewStatus = async (
    req: Request,
    res: Response
) => {
    try {
        const reviewId = Number(req.params.reviewId);
        const { isApproved } = req.body;

        if (
            !Number.isInteger(reviewId) ||
            reviewId <= 0 ||
            typeof isApproved !== "boolean"
        ) {
            return res.status(400).json({
                message: "Invalid review ID or approval status.",
            });
        }

        const [result] = await pool.query<ResultSetHeader>(
            `UPDATE product_reviews
             SET is_approved = ?
             WHERE review_id = ?`,
            [isApproved, reviewId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Review not found.",
            });
        }

        return res.status(200).json({
            message: isApproved
                ? "Review approved successfully."
                : "Review rejected successfully.",
        });

    } catch (error) {
        console.error("Update product review status error:", error);

        return res.status(500).json({
            message: "Unable to update review status.",
        });
    }
};
export const getApprovedProductReviews = async (req: Request, res: Response) => {
    try {
        const [reviews] = await pool.query<RowDataPacket[]>(
            `SELECT
                r.review_id,
                r.product_id,
                r.rating,
                r.review_text,
                r.created_at,
                u.name AS customer_name,
                p.product_name,
                p.image AS product_image
            FROM product_reviews r
            JOIN users u ON r.user_id = u.id
            JOIN products p ON r.product_id = p.product_id
            WHERE r.is_approved = TRUE
            ORDER BY r.created_at DESC`
        );

        return res.status(200).json({
            message: "Approved reviews retrieved successfully.",
            reviews
        });

    } catch (error) {
        console.error("Get approved product reviews error:", error);

        return res.status(500).json({
            message: "Failed to retrieve approved reviews."
        });
    }
};