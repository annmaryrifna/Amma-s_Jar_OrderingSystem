
import { Request, Response } from "express";
import pool from "../config/db.js";
import {
    RowDataPacket,
    ResultSetHeader
} from "mysql2";

export const getAllPaymentSubmissions = async (
    req: Request,
    res: Response
) => {
    try {
        const [payments] = await pool.execute<RowDataPacket[]>(
            `SELECT
                ps.payment_id,
                ps.order_id,
                ps.payment_type,
                ps.payment_method,
                ps.amount,
                ps.transaction_reference,
                ps.payment_proof,
                ps.verification_status,
                ps.admin_note,
                ps.submitted_at,
                o.customer_name,
                o.customer_email,
                o.customer_phone,
                o.order_status,
                o.payment_status
             FROM payment_submissions ps
             INNER JOIN orders o
                ON ps.order_id = o.order_id
             ORDER BY ps.submitted_at DESC`
        );

        return res.status(200).json({
            payments
        });

    } catch (error) {
        console.error("Get payment submissions error:", error);

        return res.status(500).json({
            message: "Failed to load payment submissions."
        });
    }
};


export const verifyPayment = async (
    req: Request,
    res: Response
) => {
    const connection = await pool.getConnection();

    try {
        const paymentId = Number(req.params.paymentId);

        if (!Number.isInteger(paymentId) || paymentId <= 0) {
            return res.status(400).json({
                message: "Invalid payment ID."
            });
        }

        await connection.beginTransaction();

        // Lock the payment submission.
        const [payments] = await connection.execute<RowDataPacket[]>(
            `SELECT *
             FROM payment_submissions
             WHERE payment_id = ?
             FOR UPDATE`,
            [paymentId]
        );

        if (payments.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                message: "Payment submission not found."
            });
        }

        const payment = payments[0];

        if (payment.verification_status !== "Pending") {
            await connection.rollback();

            return res.status(400).json({
                message: "This payment has already been processed."
            });
        }

        // Lock the associated booking.
        const [orders] = await connection.execute<RowDataPacket[]>(
            `SELECT *
             FROM orders
             WHERE order_id = ?
             FOR UPDATE`,
            [payment.order_id]
        );

        if (orders.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                message: "Associated booking not found."
            });
        }

        const order = orders[0];

        // Verify that the submitted amount matches the amount due.
        let expectedAmount = 0;

        if (payment.payment_type === "advance") {
            if (order.order_status !== "Approved – Awaiting Payment") {
                await connection.rollback();

                return res.status(400).json({
                    message: "This booking is not awaiting advance payment."
                });
            }

            expectedAmount = Number(order.advance_amount);

        } else if (payment.payment_type === "balance") {
            if (order.order_status !== "Confirmed") {
                await connection.rollback();

                return res.status(400).json({
                    message: "This booking is not eligible for balance payment verification."
                });
            }

            expectedAmount = Number(order.balance_amount);

        } else {
            await connection.rollback();

            return res.status(400).json({
                message: "Invalid payment type."
            });
        }

        if (Math.abs(Number(payment.amount) - expectedAmount) > 0.001) {
            await connection.rollback();

            return res.status(400).json({
                message: "Submitted payment amount does not match the amount due."
            });
        }

        // Mark payment as verified.
        await connection.execute<ResultSetHeader>(
            `UPDATE payment_submissions
             SET verification_status = 'Verified',
                 verified_at = CURRENT_TIMESTAMP,
                 admin_note = NULL
             WHERE payment_id = ?`,
            [paymentId]
        );

        // Update booking payment status.
        if (payment.payment_type === "advance") {
            await connection.execute<ResultSetHeader>(
                `UPDATE orders
                 SET order_status = 'Confirmed',
                     payment_status = 'Advance Paid',
                     updated_at = CURRENT_TIMESTAMP
                 WHERE order_id = ?`,
                [payment.order_id]
            );
        } else {
            await connection.execute<ResultSetHeader>(
                `UPDATE orders
                 SET payment_status = 'Fully Paid',
                     updated_at = CURRENT_TIMESTAMP
                 WHERE order_id = ?`,
                [payment.order_id]
            );
        }

        await connection.commit();

        return res.status(200).json({
            message: payment.payment_type === "advance"
                ? "Advance payment verified. Booking confirmed successfully."
                : "Balance payment verified. Booking is fully paid.",
            paymentId,
            orderId: payment.order_id,
            paymentStatus: "Verified"
        });

    } catch (error) {
        await connection.rollback();

        console.error("Verify payment error:", error);

        return res.status(500).json({
            message: "Failed to verify payment."
        });

    } finally {
        connection.release();
    }
};


export const rejectPayment = async (
    req: Request,
    res: Response
) => {
    try {
        const paymentId = Number(req.params.paymentId);
        const { reason } = req.body;

        if (!Number.isInteger(paymentId) || paymentId <= 0) {
            return res.status(400).json({
                message: "Invalid payment ID."
            });
        }

        if (
            typeof reason !== "string" ||
            !reason.trim() ||
            reason.trim().length > 500
        ) {
            return res.status(400).json({
                message: "Please provide a rejection reason (maximum 500 characters)."
            });
        }

        const [result] = await pool.execute<ResultSetHeader>(
            `UPDATE payment_submissions
             SET verification_status = 'Rejected',
                 admin_note = ?
             WHERE payment_id = ?
             AND verification_status = 'Pending'`,
            [reason.trim(), paymentId]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({
                message: "Payment not found or already processed."
            });
        }

        return res.status(200).json({
            message: "Payment submission rejected.",
            paymentId,
            verificationStatus: "Rejected"
        });

    } catch (error) {
        console.error("Reject payment error:", error);

        return res.status(500).json({
            message: "Failed to reject payment submission."
        });
    }
};
