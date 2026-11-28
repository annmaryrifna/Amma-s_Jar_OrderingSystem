
import { Request, Response } from "express";
import pool from "../config/db.js";
import { ResultSetHeader, RowDataPacket } from "mysql2";

// Submit a customer complaint
export const submitComplaint = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;

        const {
            orderId,
            subject,
            category,
            complaintMessage,
        } = req.body;

        // Validate required fields
        if (
            !orderId ||
            !subject?.trim() ||
            !category?.trim() ||
            !complaintMessage?.trim()
        ) {
            return res.status(400).json({
                message: "Please fill in all required fields.",
            });
        }

        // Check whether the booking belongs to this customer
        const [orders] = await pool.query<RowDataPacket[]>(
            `SELECT order_id
             FROM orders
             WHERE order_id = ? AND user_id = ?`,
            [orderId, userId]
        );

        if (orders.length === 0) {
            return res.status(403).json({
                message: "You cannot submit a complaint for this booking.",
            });
        }

        // Save complaint
        await pool.query<ResultSetHeader>(
            `INSERT INTO customer_complaints
            (order_id, user_id, subject, category, complaint_message)
            VALUES (?, ?, ?, ?, ?)`,
            [
                orderId,
                userId,
                subject.trim(),
                category.trim(),
                complaintMessage.trim(),
            ]
        );

        return res.status(201).json({
            message: "Your complaint has been submitted successfully.",
        });

    } catch (error) {
        console.error("Submit complaint error:", error);

        return res.status(500).json({
            message: "Unable to submit your complaint.",
        });
    }
};
export const getMyComplaints = async (
    req: Request,
    res: Response
) => {
    try {
        const userId = (req as any).user.id;

        const [complaints] = await pool.query<RowDataPacket[]>(
            `SELECT
                complaint_id,
                order_id,
                subject,
                category,
                complaint_message,
                admin_reply,
                complaint_status,
                created_at,
                updated_at
             FROM customer_complaints
             WHERE user_id = ?
             ORDER BY created_at DESC`,
            [userId]
        );

        return res.status(200).json({
            message: "Your complaints retrieved successfully.",
            complaints,
        });

    } catch (error) {
        console.error("Get customer complaints error:", error);

        return res.status(500).json({
            message: "Unable to retrieve your complaints.",
        });
    }
};

