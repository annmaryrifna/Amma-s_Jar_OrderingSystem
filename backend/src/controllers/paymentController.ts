
import { Request, Response } from "express";
import pool from "../config/db.js";
import { ResultSetHeader, RowDataPacket } from "mysql2";

export const submitPayment = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { orderId, paymentType, paymentMethod, transactionReference } = req.body;

        // Validate order ID
        const parsedOrderId = Number(orderId);

        if (!Number.isInteger(parsedOrderId) || parsedOrderId <= 0) {
            return res.status(400).json({
                message: "Invalid booking ID."
            });
        }

        // Validate payment type
        if (!["advance", "balance"].includes(paymentType)) {
            return res.status(400).json({
                message: "Invalid payment type."
            });
        }

        // Validate payment method
        if (!["upi_id", "upi_qr"].includes(paymentMethod)) {
            return res.status(400).json({
                message: "Invalid payment method."
            });
        }

        // Validate transaction reference
        if (
            typeof transactionReference !== "string" ||
            transactionReference.trim().length < 6 ||
            transactionReference.trim().length > 150
        ) {
            return res.status(400).json({
                message: "Enter a valid transaction reference."
            });
        }

        // Check booking belongs to logged-in customer
        const [orders] = await pool.execute<RowDataPacket[]>(
            `SELECT order_id, user_id, order_status,
                    payment_status, advance_amount, balance_amount
             FROM orders
             WHERE order_id = ? AND user_id = ?`,
            [parsedOrderId, user.id]
        );

        if (orders.length === 0) {
            return res.status(404).json({
                message: "Booking not found."
            });
        }

        const order = orders[0];

        // Determine eligible payment amount
        let amount = 0;

        if (paymentType === "advance") {
            if (order.order_status !== "Approved – Awaiting Payment") {
                return res.status(400).json({
                    message: "This booking is not awaiting advance payment."
                });
            }

            amount = Number(order.advance_amount);
        } else {
            if (order.order_status !== "Confirmed") {
                return res.status(400).json({
                    message: "Balance payment is available only for confirmed bookings."
                });
            }

            amount = Number(order.balance_amount);
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({
                message: "No payment is currently due."
            });
        }

        // Prevent duplicate pending or verified submissions
        const [existingPayments] = await pool.execute<RowDataPacket[]>(
            `SELECT payment_id
             FROM payment_submissions
             WHERE order_id = ?
             AND payment_type = ?
             AND verification_status IN ('Pending', 'Verified')
             LIMIT 1`,
            [parsedOrderId, paymentType]
        );

        if (existingPayments.length > 0) {
            return res.status(409).json({
                message: "A payment submission already exists for this payment."
            });
        }

        // Save payment submission
        await pool.execute<ResultSetHeader>(
            `INSERT INTO payment_submissions
             (
                order_id,
                payment_type,
                payment_method,
                amount,
                transaction_reference
             )
             VALUES (?, ?, ?, ?, ?)`,
            [
                parsedOrderId,
                paymentType,
                paymentMethod,
                amount,
                transactionReference.trim()
            ]
        );

        return res.status(201).json({
            message: "Payment details submitted successfully. Awaiting admin verification.",
            orderId: parsedOrderId,
            paymentType,
            amount,
            verificationStatus: "Pending"
        });

    } catch (error) {
        console.error("Submit payment error:", error);

        return res.status(500).json({
            message: "Failed to submit payment details."
        });
    }
};

export const getMyPaymentSubmissions = async (
    req: Request,
    res: Response
) => {
    try {
        const user = (req as any).user;

        const [payments] = await pool.execute<RowDataPacket[]>(
            `SELECT
                ps.payment_id,
                ps.order_id,
                ps.payment_type,
                ps.payment_method,
                ps.amount,
                ps.transaction_reference,
                ps.verification_status,
                ps.admin_note,
                ps.submitted_at,
                ps.verified_at
             FROM payment_submissions ps
             INNER JOIN orders o
                ON ps.order_id = o.order_id
             WHERE o.user_id = ?
             ORDER BY ps.submitted_at DESC`,
            [user.id]
        );

        return res.status(200).json({
            payments
        });

    } catch (error) {
        console.error("Get customer payments error:", error);

        return res.status(500).json({
            message: "Unable to load payment history."
        });
    }
};
