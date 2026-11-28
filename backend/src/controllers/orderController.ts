
import { Request, Response } from "express";
import pool from "../config/db.js";
import { RowDataPacket, ResultSetHeader } from "mysql2";

interface ValidatedItem {
    product_id: number;
    product_name: string;
    quantity: number;
    unit: string;
    price: number;
    price_quantity: number;
    total_price: number;

}

export const createOrder = async (req: Request, res: Response) => {
    let connection;

    try {
        const userId = (req as any).user.id;

        const {
            customerName,
            customerEmail,
            customerPhone,
            bookingDate,
            bookingSlot,
            bookingTime,
            deliveryMethod,
            houseName,
            street,
            landmark,
            pincode,
            deliveryAreaId,
            specialInstructions,
            cartItems,
        } = req.body;

        // 1. Basic validation
        if (
            typeof customerName !== "string" ||
            !customerName.trim() ||
            typeof customerEmail !== "string" ||
            !customerEmail.trim() ||
            typeof customerPhone !== "string" ||
            !customerPhone.trim() ||
            !bookingDate ||
            !bookingSlot ||
            !bookingTime ||
            !deliveryMethod ||
            !Array.isArray(cartItems) ||
            cartItems.length === 0
        ) {
            return res.status(400).json({
                message: "Please provide all required booking details.",
            });
        }

        // 2. Validate customer account
        const [users] = await pool.query<RowDataPacket[]>(
            `SELECT id, role, is_active
             FROM users
             WHERE id = ?`,
            [userId]
        );

        if (
            users.length === 0 ||
            users[0].role !== "customer" ||
            !users[0].is_active
        ) {
            return res.status(403).json({
                message: "Only active customer accounts can place bookings.",
            });
        }

        // 3. Validate customer details
        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())
        ) {
            return res.status(400).json({
                message: "Please enter a valid email address.",
            });
        }

        if (
            !/^(?:\+91[\s-]?)?[6-9]\d{9}$/.test(customerPhone.trim())
        ) {
            return res.status(400).json({
                message: "Please enter a valid phone number.",
            });
        }

        // 4. Validate booking slot
        if (!["morning", "evening"].includes(bookingSlot)) {
            return res.status(400).json({
                message: "Invalid booking slot.",
            });
        }

        // 5. Validate booking time
        const allowedTimes: Record<string, string[]> = {
            morning: [
                "08:00:00",
                "09:00:00",
                "10:00:00",
                "11:00:00",
                "12:00:00",
            ],
            evening: [
                "16:00:00",
                "17:00:00",
                "18:00:00",
                "19:00:00",
                "20:00:00",
            ],
        };

        const timeMap: Record<string, string> = {
            "8:00 AM": "08:00:00",
            "9:00 AM": "09:00:00",
            "10:00 AM": "10:00:00",
            "11:00 AM": "11:00:00",
            "12:00 PM": "12:00:00",
            "4:00 PM": "16:00:00",
            "5:00 PM": "17:00:00",
            "6:00 PM": "18:00:00",
            "7:00 PM": "19:00:00",
            "8:00 PM": "20:00:00",
        };

        const normalizedTime = timeMap[bookingTime] || bookingTime;

        if (
            typeof normalizedTime !== "string" ||
            !allowedTimes[bookingSlot].includes(normalizedTime)
        ) {
            return res.status(400).json({
                message: "Invalid time for the selected booking slot.",
            });
        }

        // 6. Validate booking date
        if (
            typeof bookingDate !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(bookingDate)
        ) {
            return res.status(400).json({
                message: "Invalid booking date.",
            });
        }

        const [year, month, day] = bookingDate.split("-").map(Number);

        const selectedDate = new Date(
            Date.UTC(year, month - 1, day)
        );

        if (
            selectedDate.getUTCFullYear() !== year ||
            selectedDate.getUTCMonth() !== month - 1 ||
            selectedDate.getUTCDate() !== day
        ) {
            return res.status(400).json({
                message: "Invalid booking date.",
            });
        }

        // Get today's date in the business timezone (India)
        const todayString = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Kolkata",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).format(new Date());

        const [todayYear, todayMonth, todayDay] =
            todayString.split("-").map(Number);

        const today = new Date(
            Date.UTC(todayYear, todayMonth - 1, todayDay)
        );

        const minimumDate = new Date(today);
        minimumDate.setUTCDate(minimumDate.getUTCDate() + 4);

        if (selectedDate < minimumDate) {
            return res.status(400).json({
                message: "Bookings must be made at least 4 days in advance.",
            });
        }

        // 7. Validate delivery method
        if (!["delivery", "pickup"].includes(deliveryMethod)) {
            return res.status(400).json({
                message: "Invalid delivery method.",
            });
        }
        let deliveryCharge = 0;
        let selectedDeliveryArea: RowDataPacket | null = null;
        // 8. Validate delivery address
        if (deliveryMethod === "delivery") {
            if (
                typeof houseName !== "string" ||
                !houseName.trim() ||
                typeof street !== "string" ||
                !street.trim() ||
                typeof landmark !== "string" ||
                !landmark.trim()
            ) {
                return res.status(400).json({
                    message: "Please provide your complete delivery address.",
                });
            }

            if (!/^\d{6}$/.test(String(pincode || "").trim())) {
                return res.status(400).json({
                    message: "Please enter a valid 6-digit PIN code.",
                });
            }

            const selectedAreaId = Number(deliveryAreaId);

            if (
                !Number.isInteger(selectedAreaId) ||
                selectedAreaId <= 0
            ) {
                return res.status(400).json({
                    message: "Please select a valid delivery area.",
                });
            }

            const [deliveryAreas] = await pool.query<RowDataPacket[]>(
                `SELECT area_id, area_name, pincode, delivery_charge
     FROM delivery_areas
     WHERE area_id = ?
     AND pincode = ?
     AND is_active = TRUE`,
                [selectedAreaId, pincode.trim()]
            );

            if (deliveryAreas.length === 0) {
                return res.status(400).json({
                    message: "The selected delivery area is unavailable. Please check your PIN code again.",
                });
            }
            selectedDeliveryArea = deliveryAreas[0];
            deliveryCharge = Number(selectedDeliveryArea.delivery_charge);

            
        }

        // 9. Validate special instructions
        if (
            specialInstructions !== undefined &&
            specialInstructions !== null &&
            typeof specialInstructions !== "string"
        ) {
            return res.status(400).json({
                message: "Invalid special instructions.",
            });
        }

        // 10. Get database connection
        connection = await pool.getConnection();

        const validatedItems: ValidatedItem[] = [];
        let subtotal = 0;

        // 11. Validate cart products and calculate prices
        for (const item of cartItems) {
            const productId = Number(item.product_id);
            const quantity = Number(item.quantity);

            if (
                !Number.isInteger(productId) ||
                productId <= 0 ||
                !Number.isFinite(quantity) ||
                quantity <= 0
            ) {
                return res.status(400).json({
                    message: "Invalid product or quantity.",
                });
            }

            // Get current product information from database
            const [products] = await pool.query<RowDataPacket[]>(
                `SELECT
                    product_id,
                    product_name,
                    price,
                    price_quantity,
                    unit,
                    purchase_options
                 FROM products
                 WHERE product_id = ?
                 AND is_active = TRUE`,
                [productId]
            );

            if (products.length === 0) {
                return res.status(400).json({
                    message: "One or more products are unavailable.",
                });
            }

            const product = products[0];

            // Parse purchase options
            let options = product.purchase_options;

            if (typeof options === "string") {
                try {
                    options = JSON.parse(options);
                } catch {
                    return res.status(400).json({
                        message: `Invalid purchase options for ${product.product_name}.`,
                    });
                }
            }

            if (
                !Array.isArray(options) ||
                !options.some(
                    (option: number) => Number(option) === quantity
                )
            ) {
                return res.status(400).json({
                    message: `Invalid purchase quantity for ${product.product_name}.`,
                });
            }

            // Validate product pricing
            const price = Number(product.price);
            const priceQuantity = Number(product.price_quantity);

            if (
                !Number.isFinite(price) ||
                price <= 0 ||
                !Number.isFinite(priceQuantity) ||
                priceQuantity <= 0
            ) {
                return res.status(400).json({
                    message: "Invalid product pricing configuration.",
                });
            }

            // Calculate price from database values
            const totalPrice = Number(
                ((price / priceQuantity) * quantity).toFixed(2)
            );

           
            validatedItems.push({
                product_id: product.product_id,
                product_name: product.product_name,
                quantity,
                unit: product.unit,
                price,
                price_quantity: priceQuantity,
                total_price: totalPrice,
            });

            subtotal += totalPrice;
        }

        subtotal = Number(subtotal.toFixed(2));

        // Check the daily booking limit
        const [settings] = await connection.query<RowDataPacket[]>(
            `SELECT daily_booking_limit
     FROM capacity_settings
     ORDER BY setting_id DESC
     LIMIT 1`
        );

        if (settings.length === 0) {
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
            return res.status(500).json({
                message: "Invalid daily booking limit.",
            });
        }

        // Count confirmed and completed bookings for this date
        const [bookingRows] = await connection.query<RowDataPacket[]>(
            `SELECT COUNT(*) AS used_bookings
     FROM orders
     WHERE booking_date = ?
     AND order_status IN ( 'Approved – Awaiting Payment','Confirmed', 'Completed')`,
            [bookingDate]
        );

        const usedBookings = Number(bookingRows[0].used_bookings);

        const remainingBookings = Math.max(
            0,
            dailyBookingLimit - usedBookings
        );

        const limitReached = usedBookings >= dailyBookingLimit;

        

        // 15. Pending bookings do not receive the discount yet
        // Discount will be calculated during admin approval.
        const discountPercentage = 0;
        const discountAmount = 0;

        const totalAmount = Number(
            (subtotal + deliveryCharge).toFixed(2)
        );

        // No payment is collected before admin approval.
        const advanceAmount = 0;
        const balanceAmount = totalAmount;

        // 16. Start database transaction
        await connection.beginTransaction();

        try {
            // Insert main booking
            const [orderResult] =
                await connection.execute<ResultSetHeader>(
                    `INSERT INTO orders (
                        user_id,
                        customer_name,
                        customer_email,
                        customer_phone,
                        booking_date,
                        booking_slot,
                        booking_time,
                        delivery_method,
                        house_name,
                        street,
                        landmark,
                        pincode,
                        delivery_area_id,
                        delivery_area_name,
                        special_instructions,
                        subtotal,
                        discount_percentage,
                        discount_amount,
                        delivery_charge,
                        total_amount,
                        advance_amount,
                        balance_amount,
                        order_status,
                        payment_status
                    ) VALUES (
                        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                    )`,
                    [
                        userId,
                        customerName.trim(),
                        customerEmail.trim(),
                        customerPhone.trim(),
                        bookingDate,
                        bookingSlot,
                        normalizedTime,
                        deliveryMethod,
                        deliveryMethod === "delivery"
                            ? houseName.trim()
                            : null,
                        deliveryMethod === "delivery"
                            ? street.trim()
                            : null,
                        deliveryMethod === "delivery"
                            ? landmark.trim()
                            : null,
                        deliveryMethod === "delivery"
                            ? pincode.trim()
                            : null,
                        selectedDeliveryArea?.area_id ?? null,
                        selectedDeliveryArea?.area_name ?? null,
                        specialInstructions?.trim() || null,
                        subtotal,
                        discountPercentage,
                        discountAmount,
                        deliveryCharge,
                        totalAmount,
                        advanceAmount,
                        balanceAmount,
                        "Pending Admin Approval",
                        "Not Paid",
                    ]
                );

            const orderId = orderResult.insertId;

            // Insert each product into order_items
            for (const item of validatedItems) {
                await connection.execute<ResultSetHeader>(
                    `INSERT INTO order_items (
                        order_id,
                        product_id,
                        product_name,
                        quantity,
                        unit,
                        price,
                        price_quantity,
                        total_price
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        orderId,
                        item.product_id,
                        item.product_name,
                        item.quantity,
                        item.unit,
                        item.price,
                        item.price_quantity,
                        item.total_price,
                    ]
                );
            }

            // Commit transaction
            await connection.commit();

            return res.status(201).json({
                message: "Your booking request has been submitted successfully. Please wait for admin approval.",
                orderId,
                orderStatus: "Pending Admin Approval",
                paymentStatus: "Not Paid",
                dailyBookingLimit,
                usedBookings,
                remainingBookings,
                limitReached,
                subtotal,
                discountPercentage,
                discountAmount,
                deliveryCharge,
                totalAmount,
                advanceAmount,
                balanceAmount,
                bookingTime: normalizedTime,
                items: validatedItems,
            });

        } catch (error) {
            await connection.rollback();
            throw error;
        }

    } catch (error) {
        console.error("Create order error:", error);

        return res.status(500).json({
            message: "Unable to process booking request.",
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};

export const getCustomerOrders = async (
    req: Request,
    res: Response
) => {
    try {
        const userId = (req as any).user.id;

        const [orders] = await pool.query<RowDataPacket[]>(
            `SELECT
                o.order_id,
                DATE_FORMAT(o.booking_date, '%Y-%m-%d') AS booking_date,
                o.booking_slot,
                o.booking_time,
                o.delivery_method,
                o.subtotal,
                o.discount_percentage,
                o.discount_amount,
                o.delivery_charge,
                o.total_amount,
                o.advance_amount,
                o.balance_amount,
                o.order_status,
                o.payment_status,
                o.rejection_reason,
                o.created_at
             FROM orders o
             WHERE o.user_id = ?
             ORDER BY o.booking_date DESC`,
            [userId]
        );

        // Retrieve products for each booking
        for (const order of orders) {
            const [items] = await pool.query<RowDataPacket[]>(
                `SELECT
    oi.product_id,
    oi.product_name,
    oi.quantity,
    oi.unit,
    oi.price,
    oi.price_quantity,
    oi.total_price,
    p.image AS product_image
FROM order_items oi
LEFT JOIN products p
    ON oi.product_id = p.product_id
WHERE oi.order_id = ?`,
                [order.order_id]
            );

            order.items = items;
        }

        return res.status(200).json({
            message: "Customer bookings retrieved successfully.",
            orders,
        });

    } catch (error) {
        console.error("Get customer orders error:", error);

        return res.status(500).json({
            message: "Unable to retrieve your bookings.",
        });
    }
};

export const getAllDeliveryAreas = async (
    req: Request,
    res: Response
) => {
    try {
        const [areas] = await pool.query<RowDataPacket[]>(
            `SELECT area_id, area_name, pincode, delivery_charge
             FROM delivery_areas
             WHERE is_active = TRUE
             ORDER BY area_name ASC`
        );

        return res.status(200).json({
            available: areas.length > 0,
            areas,
            message: areas.length > 0
                ? "Delivery localities retrieved successfully."
                : "No delivery localities are currently available."
        });
    } catch (error) {
        console.error("Get delivery areas error:", error);

        return res.status(500).json({
            message: "Unable to load delivery localities."
        });
    }
};

export const getDeliveryAreasByPincode = async (
    req: Request,
    res: Response
) => {
    try {
        const pincode = String(req.params.pincode || "").trim();

        if (!/^\d{6}$/.test(pincode)) {
            return res.status(400).json({
                message: "Please enter a valid 6-digit PIN code.",
            });
        }

        const [areas] = await pool.query<RowDataPacket[]>(
            `SELECT area_id, area_name, pincode, delivery_charge
             FROM delivery_areas
             WHERE pincode = ?
             AND is_active = TRUE
             ORDER BY area_name ASC`,
            [pincode]
        );

        return res.status(200).json({
            available: areas.length > 0,
            areas,
            message: areas.length > 0
                ? "Delivery areas retrieved successfully."
                : "Delivery is not currently available for this area.",
        });

    } catch (error) {
        console.error("Delivery area lookup error:", error);

        return res.status(500).json({
            message: "Unable to check delivery availability.",
        });
    }
};

export const cancelCustomerOrder = async (
    req: Request,
    res: Response
) => {
    let connection;

    try {
        const userId = (req as any).user.id;
        const orderId = Number(req.params.orderId);

        if (!Number.isInteger(orderId) || orderId <= 0) {
            return res.status(400).json({
                message: "Invalid booking ID."
            });
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Find and lock this customer's booking
        const [orders] = await connection.query<RowDataPacket[]>(
            `SELECT order_id, order_status
             FROM orders
             WHERE order_id = ? AND user_id = ?
             FOR UPDATE`,
            [orderId, userId]
        );

        if (orders.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                message: "Booking not found."
            });
        }

        const order = orders[0];

        // Only these two booking statuses can be cancelled
        const allowedStatuses = [
            "Pending Admin Approval",
            "Approved – Awaiting Payment"
        ];

        if (!allowedStatuses.includes(order.order_status)) {
            await connection.rollback();

            return res.status(400).json({
                message: "This booking can no longer be cancelled."
            });
        }

        // Check whether any advance payment details were submitted
        const [payments] = await connection.query<RowDataPacket[]>(
            `SELECT payment_id
     FROM payment_submissions
     WHERE order_id = ?
     AND payment_type = 'advance'
     LIMIT 1`,
            [orderId]
        );

        if (payments.length > 0) {
            await connection.rollback();

            return res.status(400).json({
                message: "You cannot cancel this booking after submitting advance payment details."
            });
        }

        // Cancel the booking
        await connection.execute(
            `UPDATE orders
             SET order_status = 'Cancelled by Customer'
             WHERE order_id = ? AND user_id = ?`,
            [orderId, userId]
        );

        await connection.commit();

        return res.status(200).json({
            message: "Your booking has been cancelled successfully.",
            orderStatus: "Cancelled by Customer"
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error("Cancel customer booking error:", error);

        return res.status(500).json({
            message: "Unable to cancel your booking."
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};
