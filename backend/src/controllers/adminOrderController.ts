
import { Request, Response } from "express";
import pool from "../config/db.js";
import {
    RowDataPacket,
    ResultSetHeader,
} from "mysql2";
import type { PoolConnection } from "mysql2/promise";

const PENDING_STATUS = "Pending Admin Approval";
const APPROVED_STATUS = "Approved – Awaiting Payment";
const CONFIRMED_STATUS = "Confirmed";
const COMPLETED_STATUS = "Completed";

// ==========================================
// 1. GET ALL CUSTOMER BOOKINGS
// ==========================================

export const getAllOrders = async (
    req: Request,
    res: Response
) => {
    try {
        const [orders] = await pool.query<RowDataPacket[]>(
            `SELECT
                o.order_id,
                o.user_id,
                o.customer_name,
                o.customer_email,
                o.customer_phone,
                o.booking_date,
                o.booking_slot,
                o.booking_time,
                o.delivery_method,
                o.house_name,
                o.street,
                o.landmark,
                o.pincode,
                o.delivery_area_name,
                o.special_instructions,
                o.subtotal,
                o.discount_percentage,
                o.discount_amount,
                o.delivery_charge,
                o.total_amount,
                o.advance_amount,
                o.balance_amount,
                o.order_status,
                o.balance_payment_preference,
o.balance_payment_method,
                o.payment_status,
                o.created_at
             FROM orders o
             ORDER BY o.created_at DESC`
        );

        for (const order of orders) {
            const [items] = await pool.query<RowDataPacket[]>(
                `SELECT
        product_id,
        product_name,
        quantity,
        unit,
        price,
        price_quantity,
        total_price
     FROM order_items
     WHERE order_id = ?`,
                [order.order_id]
            );

            order.items = items;
        }

        return res.status(200).json({
            message: "All bookings retrieved successfully.",
            orders,
        });

    } catch (error) {
        console.error("Get all orders error:", error);

        return res.status(500).json({
            message: "Unable to retrieve bookings.",
        });
    }
};


// ==========================================
// 2. APPROVE CUSTOMER BOOKING
// ==========================================

export const approveOrder = async (
    req: Request,
    res: Response
) => {
    let connection: PoolConnection | undefined;

    try {
        const orderId = Number(req.params.orderId);

        if (!Number.isInteger(orderId) || orderId <= 0) {
            return res.status(400).json({
                message: "Invalid booking ID.",
            });
        }

        connection = await pool.getConnection();

        await connection.beginTransaction();

        try {
            // 1. Lock the booking being approved
            const [orders] = await connection.query<RowDataPacket[]>(
                `SELECT
                    order_id,
                    user_id,
                    booking_date,
                    subtotal,
                    delivery_charge,
                    order_status
                 FROM orders
                 WHERE order_id = ?
                 FOR UPDATE`,
                [orderId]
            );

            if (orders.length === 0) {
                await connection.rollback();

                return res.status(404).json({
                    message: "Booking not found.",
                });
            }

            const order = orders[0];

            // 2. Check current booking status
            if (order.order_status !== PENDING_STATUS) {
                await connection.rollback();

                return res.status(409).json({
                    message: "This booking is no longer pending approval.",
                });
            }


            // 3. Lock the daily booking settings row.
            // This serializes admin approvals.
            const [settings] = await connection.query<RowDataPacket[]>(
                `SELECT setting_id, daily_booking_limit
     FROM capacity_settings
     ORDER BY setting_id DESC
     LIMIT 1
     FOR UPDATE`
            );

            if (settings.length === 0) {
                await connection.rollback();

                return res.status(500).json({
                    message: "Daily booking limit setting is missing.",
                });
            }

            const dailyBookingLimit = Number(
                settings[0].daily_booking_limit
            );

            if (
                !Number.isInteger(dailyBookingLimit) ||
                dailyBookingLimit <= 0
            ) {
                await connection.rollback();

                return res.status(500).json({
                    message: "Invalid daily booking limit.",
                });
            }

            // 4. Count bookings already approved for this date.
            // Approved-awaiting-payment bookings also count because
            // they have already been accepted by the admin.
            const [bookingRows] = await connection.query<RowDataPacket[]>(
                `SELECT COUNT(*) AS used_bookings
                FROM orders
                 WHERE booking_date = ?
                      AND order_status IN (?, ?, ?)`,
                [
                    order.booking_date,
                    APPROVED_STATUS,
                    CONFIRMED_STATUS,
                    COMPLETED_STATUS,
                ]
            );

            const usedBookings = Number(bookingRows[0].used_bookings);

            const projectedBookings = usedBookings + 1;

            const limitExceeded = projectedBookings > dailyBookingLimit;

            // 5. Require explicit admin confirmation when exceeding the limit.
            const overrideDailyLimit =
                req.body?.overrideDailyLimit === true;

            if (limitExceeded && !overrideDailyLimit) {
                await connection.rollback();

                return res.status(409).json({
                    requiresOverride: true,
                    message:
                        "Daily booking limit reached. Do you want to approve this additional booking anyway?",
                    dailyBookingLimit,
                    usedBookings,
                    projectedBookings,
                    bookingDate: order.booking_date,
                });
            }


            // 7. Check whether the customer has a successful booking
            const [previousBookings] =
                await connection.query<RowDataPacket[]>(
                    `SELECT order_id
                     FROM orders
                     WHERE user_id = ?
                     AND order_status IN (?, ?)
                     LIMIT 1`,
                    [
                        order.user_id,
                        CONFIRMED_STATUS,
                        COMPLETED_STATUS,
                    ]
                );

            // 8. Check whether another first-booking discount
            // is currently reserved by an approved booking.
            const [activeDiscountBookings] =
                await connection.query<RowDataPacket[]>(
                    `SELECT order_id
                     FROM orders
                     WHERE user_id = ?
                     AND order_id != ?
                     AND discount_percentage > 0
                     AND order_status = ?
                     LIMIT 1`,
                    [
                        order.user_id,
                        orderId,
                        APPROVED_STATUS,
                    ]
                );

            // Prevent two active bookings from receiving the
            // first-booking discount at the same time.
            if (
                previousBookings.length === 0 &&
                activeDiscountBookings.length > 0
            ) {
                await connection.rollback();

                return res.status(409).json({
                    message: "This customer already has another discounted booking awaiting payment. Resolve that booking before approving another first-booking discount.",
                });
            }

            // 9. Calculate first-booking discount
            const discountPercentage =
                previousBookings.length === 0 ? 20 : 0;

            const subtotal = Number(order.subtotal);
            const deliveryCharge = Number(
                order.delivery_charge || 0
            );

            if (
                !Number.isFinite(subtotal) ||
                subtotal <= 0 ||
                !Number.isFinite(deliveryCharge) ||
                deliveryCharge < 0
            ) {
                await connection.rollback();

                return res.status(400).json({
                    message: "Invalid booking amount.",
                });
            }

            const discountAmount = Number(
                (
                    subtotal *
                    discountPercentage /
                    100
                ).toFixed(2)
            );

            // 10. Calculate final amount
            const totalAmount = Number(
                (
                    subtotal -
                    discountAmount +
                    deliveryCharge
                ).toFixed(2)
            );

            // 11. Calculate 40% advance
            const advanceAmount = Number(
                (totalAmount * 0.40).toFixed(2)
            );

            // 12. Calculate remaining 60%
            const balanceAmount = Number(
                (totalAmount - advanceAmount).toFixed(2)
            );

            // 13. Update booking
            const [updateResult] =
                await connection.execute<ResultSetHeader>(
                    `UPDATE orders
                     SET
                        discount_percentage = ?,
                        discount_amount = ?,
                        total_amount = ?,
                        advance_amount = ?,
                        balance_amount = ?,
                        order_status = ?,
                        payment_status = ?
                     WHERE order_id = ?
                     AND order_status = ?`,
                    [
                        discountPercentage,
                        discountAmount,
                        totalAmount,
                        advanceAmount,
                        balanceAmount,
                        APPROVED_STATUS,
                        "Advance Payment Pending",
                        orderId,
                        PENDING_STATUS,
                    ]
                );

            if (updateResult.affectedRows !== 1) {
                await connection.rollback();

                return res.status(409).json({
                    message: "Booking approval could not be completed. Please refresh and try again.",
                });
            }

            // 14. Commit all changes
            await connection.commit();

            return res.status(200).json({
                message: "Booking approved successfully. Customer can now pay the 40% advance.",

                orderId,

                orderStatus: APPROVED_STATUS,
                paymentStatus: "Advance Payment Pending",

                subtotal,
                discountPercentage,
                discountAmount,
                deliveryCharge,
                totalAmount,
                advanceAmount,
                balanceAmount,

                dailyBookingLimit,
                usedBookings: projectedBookings,
                limitExceeded,
            });

        } catch (error) {
            await connection.rollback();
            throw error;
        }

    } catch (error) {
        console.error("Approve booking error:", error);

        return res.status(500).json({
            message: "Unable to approve booking. Please try again.",
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};

export const rejectOrder = async (req: Request, res: Response) => {
    try {
        const orderId = Number(req.params.orderId);
        const { reason } = req.body;

        // Validate booking ID
        if (!Number.isInteger(orderId) || orderId <= 0) {
            return res.status(400).json({
                message: "Invalid booking ID."
            });
        }

        // Validate rejection reason
        if (!reason || typeof reason !== "string" || !reason.trim()) {
            return res.status(400).json({
                message: "Please provide a rejection reason."
            });
        }

        if (reason.trim().length > 500) {
            return res.status(400).json({
                message: "Rejection reason cannot exceed 500 characters."
            });
        }

        // Only pending bookings can be rejected
        const [result] = await pool.execute<ResultSetHeader>(
            `UPDATE orders
             SET order_status = 'Rejected',
                 rejection_reason = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE order_id = ?
             AND order_status = ?`,
            [
                reason.trim(),
                orderId,
                PENDING_STATUS
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({
                message: "Booking not found or it is no longer pending approval."
            });
        }

        return res.status(200).json({
            message: "Booking rejected successfully.",
            orderId,
            orderStatus: "Rejected",
            rejectionReason: reason.trim()
        });

    } catch (error) {
        console.error("Reject booking error:", error);

        return res.status(500).json({
            message: "Failed to reject booking."
        });
    }
};
// ==========================================
// UPDATE ORDER PREPARATION / DELIVERY STATUS
// ==========================================

export const updateOrderStatus = async (
    req: Request,
    res: Response
) => {
    try {
        const orderId = Number(req.params.orderId);
        const { orderStatus } = req.body;

        if (!Number.isInteger(orderId) || orderId <= 0) {
            return res.status(400).json({
                message: "Invalid booking ID."
            });
        }

        const allowedStatuses = [
            "Preparing Order",
            "Out for Delivery",
            "Ready for Pickup",
            "Completed"
        ];

        if (!allowedStatuses.includes(orderStatus)) {
            return res.status(400).json({
                message: "Invalid order status."
            });
        }

        const [orders] = await pool.query<RowDataPacket[]>(
            `SELECT order_id, order_status, delivery_method, payment_status
             FROM orders WHERE order_id = ?`,
            [orderId]
        );

        if (orders.length === 0) {
            return res.status(404).json({
                message: "Booking not found."
            });
        }

        const order = orders[0];
        if (
            orderStatus === "Completed" &&
            order.payment_status !== "Fully Paid"
        ) {
            return res.status(400).json({
                message: "The remaining balance must be fully paid before completing this booking."
            });
        }

        // Only confirmed or in-progress bookings F be updated.
        const validTransitions: Record<string, string[]> = {
            "Confirmed": ["Preparing Order"],
            "Preparing Order": order.delivery_method === "delivery"
                ? ["Out for Delivery"]
                : ["Ready for Pickup"],
            "Out for Delivery": ["Completed"],
            "Ready for Pickup": ["Completed"]
        };

        const nextStatuses = validTransitions[order.order_status] || [];

        if (!nextStatuses.includes(orderStatus)) {
            return res.status(409).json({
                message: `Cannot change status from ${order.order_status} to ${orderStatus}.`
            });
        }

        await pool.execute(
            `UPDATE orders
             SET order_status = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE order_id = ?`,
            [orderStatus, orderId]
        );

        return res.status(200).json({
            message: "Booking status updated successfully.",
            orderId,
            orderStatus
        });

    } catch (error) {
        console.error("Update order status error:", error);

        return res.status(500).json({
            message: "Unable to update booking status."
        });
    }
};


export const getDailyCapacityLimit = async (
    req: Request,
    res: Response
) => {
    try {
        const [settings] = await pool.query<RowDataPacket[]>(
            `SELECT setting_id, daily_booking_limit, updated_at
             FROM capacity_settings
             ORDER BY setting_id DESC
             LIMIT 1`
        );

        if (settings.length === 0) {
            return res.status(404).json({
                message: "Daily booking limit setting not found."
            });
        }

        return res.status(200).json({
            message: "Daily booking limit retrieved successfully.",
            settings: settings[0]
        });

    } catch (error) {
        console.error("Get daily capacity error:", error);

        return res.status(500).json({
            message: "Unable to retrieve daily booking limit."
        });
    }
};


export const updateDailyCapacityLimit = async (
    req: Request,
    res: Response
) => {
    try {
        const dailyBookingLimit = Number(req.body?.daily_booking_limit);

        if (
            !Number.isInteger(dailyBookingLimit) ||
            dailyBookingLimit < 1 ||
            dailyBookingLimit > 100
        ) {
            return res.status(400).json({
                message: "Daily booking limit must be a whole number between 1 and 100."
            });
        }

        const [settings] = await pool.query<RowDataPacket[]>(
            `SELECT setting_id
             FROM capacity_settings
             ORDER BY setting_id DESC
             LIMIT 1`
        );

        if (settings.length === 0) {
            return res.status(404).json({
                message: "Daily booking limit setting not found."
            });
        }

        await pool.execute(
            `UPDATE capacity_settings
             SET daily_booking_limit = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE setting_id = ?`,
            [dailyBookingLimit, settings[0].setting_id]
        );

        return res.status(200).json({
            message: "Daily booking limit updated successfully.",
            daily_booking_limit: dailyBookingLimit
        });

    } catch (error) {
        console.error("Update daily capacity error:", error);

        return res.status(500).json({
            message: "Unable to update daily booking limit."
        });
    }
};
