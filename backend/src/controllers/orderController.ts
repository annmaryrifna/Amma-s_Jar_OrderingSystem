
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
    capacity_units: number;
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
            const [products] = await connection.query<RowDataPacket[]>(
                `SELECT
                    product_id,
                    product_name,
                    price,
                    price_quantity,
                    unit,
                    purchase_options,
                    capacity_units_per_sale_unit
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

            // Calculate capacity units
            const capacityFactor = Number(
                product.capacity_units_per_sale_unit || 1
            );

            if (
                !Number.isFinite(capacityFactor) ||
                capacityFactor <= 0
            ) {
                return res.status(400).json({
                    message: "Invalid product capacity configuration.",
                });
            }

            const capacityUnits = Number(
                (quantity * capacityFactor).toFixed(2)
            );

            validatedItems.push({
                product_id: product.product_id,
                product_name: product.product_name,
                quantity,
                unit: product.unit,
                price,
                price_quantity: priceQuantity,
                total_price: totalPrice,
                capacity_units: capacityUnits,
            });

            subtotal += totalPrice;
        }

        subtotal = Number(subtotal.toFixed(2));

        // 12. Get configured daily capacity
        const [settings] = await connection.query<RowDataPacket[]>(
            `SELECT daily_capacity
             FROM capacity_settings
             ORDER BY setting_id DESC
             LIMIT 1`
        );

        if (settings.length === 0) {
            return res.status(500).json({
                message: "Daily capacity setting is missing.",
            });
        }

        const dailyCapacity = Number(settings[0].daily_capacity);

        if (
            !Number.isFinite(dailyCapacity) ||
            dailyCapacity <= 0
        ) {
            return res.status(500).json({
                message: "Invalid daily capacity setting.",
            });
        }

        // 13. Calculate already reserved capacity for selected date
        const [capacityRows] = await connection.query<RowDataPacket[]>(
            `SELECT COALESCE(SUM(oi.capacity_units), 0) AS used_capacity
             FROM orders o
             JOIN order_items oi
                ON o.order_id = oi.order_id
             WHERE o.booking_date = ?
             AND o.order_status IN (
                'Approved – Awaiting Payment',
                'Confirmed',
                'Completed'
             )`,
            [bookingDate]
        );

        const usedCapacity = Number(
            capacityRows[0].used_capacity
        );

        // 14. Calculate requested capacity
        const requestedCapacity = Number(
            validatedItems.reduce(
                (total, item) => total + item.capacity_units,
                0
            ).toFixed(2)
        );

        const remainingCapacity = Math.max(
            0,
            dailyCapacity - usedCapacity
        );

        if (
            usedCapacity + requestedCapacity > dailyCapacity
        ) {
            return res.status(400).json({
                message: "Sorry, this date has insufficient booking capacity.",
                dailyCapacity,
                usedCapacity,
                remainingCapacity,
                requestedCapacity,
            });
        }

        // 15. Pending bookings do not receive the discount yet
        // Discount will be calculated during admin approval.
        const discountPercentage = 0;
        const discountAmount = 0;
        const deliveryCharge = 0;

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
                        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
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
                        total_price,
                        capacity_units
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        orderId,
                        item.product_id,
                        item.product_name,
                        item.quantity,
                        item.unit,
                        item.price,
                        item.price_quantity,
                        item.total_price,
                        item.capacity_units,
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
                subtotal,
                discountPercentage,
                discountAmount,
                deliveryCharge,
                totalAmount,
                advanceAmount,
                balanceAmount,
                dailyCapacity,
                usedCapacity,
                remainingCapacity,
                requestedCapacity,
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
                o.booking_date,
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
             ORDER BY o.created_at DESC`,
            [userId]
        );

        // Retrieve products for each booking
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
