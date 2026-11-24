
import { Request, Response } from "express";
import pool from "../config/db.js";
import { RowDataPacket } from "mysql2";

// GET CUSTOMER PROFILE
export const getCustomerProfile = async (
    req: Request,
    res: Response
) => {
    try {
        const customerId = (req as any).user.id;

        const [users] = await pool.query<RowDataPacket[]>(
            `SELECT id, name, email, phone
             FROM users
             WHERE id = ? AND role = 'customer' AND is_active = 1`,
            [customerId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "Customer account not found."
            });
        }

        return res.status(200).json({
            message: "Customer profile retrieved successfully.",
            profile: users[0]
        });

    } catch (error) {
        console.error("Get customer profile error:", error);

        return res.status(500).json({
            message: "Unable to retrieve customer profile."
        });
    }
};


// UPDATE CUSTOMER PROFILE
export const updateCustomerProfile = async (
    req: Request,
    res: Response
) => {
    try {
        const customerId = (req as any).user.id;
        const { name, email, phone } = req.body;

        const cleanName =
            typeof name === "string" ? name.trim() : "";

        const cleanEmail =
            typeof email === "string" ? email.trim().toLowerCase() : "";

        const cleanPhone =
            typeof phone === "string" ? phone.trim() : "";

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phonePattern = /^(?:\+91[\s-]?)?[6-9]\d{9}$/;

        if (!cleanName || cleanName.length > 100) {
            return res.status(400).json({
                message: "Enter a valid name."
            });
        }

        if (!emailPattern.test(cleanEmail) || cleanEmail.length > 150) {
            return res.status(400).json({
                message: "Enter a valid email address."
            });
        }

        if (cleanPhone && !phonePattern.test(cleanPhone)) {
            return res.status(400).json({
                message: "Enter a valid Indian mobile number."
            });
        }

        const [existingUsers] = await pool.query<RowDataPacket[]>(
            `SELECT id FROM users
             WHERE email = ? AND id != ?`,
            [cleanEmail, customerId]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                message: "This email address is already registered."
            });
        }

        const [result]: any = await pool.execute(
            `UPDATE users
             SET name = ?, email = ?, phone = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND role = 'customer' AND is_active = 1`,
            [cleanName, cleanEmail, cleanPhone || null, customerId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Customer account not found."
            });
        }

        return res.status(200).json({
            message: "Profile updated successfully.",
            profile: {
                id: customerId,
                name: cleanName,
                email: cleanEmail,
                phone: cleanPhone || null
            }
        });

    } catch (error) {
        console.error("Update customer profile error:", error);

        return res.status(500).json({
            message: "Unable to update customer profile."
        });
    }
};
