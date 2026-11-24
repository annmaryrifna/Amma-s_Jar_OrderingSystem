
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import pool from "../config/db.js";
import { ResultSetHeader, RowDataPacket } from "mysql2";

// GET ADMIN PROFILE
export const getAdminProfile = async (
    req: Request,
    res: Response
) => {
    try {
        const adminId = (req as any).user.id;

        const [users] = await pool.query<RowDataPacket[]>(
            `SELECT id, name, email, phone, role
             FROM users
             WHERE id = ? AND role = 'admin' AND is_active = 1`,
            [adminId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "Admin account not found."
            });
        }

        return res.status(200).json({
            message: "Admin profile retrieved successfully.",
            profile: users[0]
        });

    } catch (error) {
        console.error("Get admin profile error:", error);

        return res.status(500).json({
            message: "Unable to retrieve admin profile."
        });
    }
};


// UPDATE ADMIN PROFILE
export const updateAdminProfile = async (
    req: Request,
    res: Response
) => {
    try {
        const adminId = (req as any).user.id;
        const { name, email, phone } = req.body;

        const cleanName = typeof name === "string" ? name.trim() : "";
        const cleanEmail = typeof email === "string"
            ? email.trim().toLowerCase()
            : "";
        const cleanPhone = typeof phone === "string"
            ? phone.trim()
            : "";

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phonePattern = /^(?:\+91[\s-]?)?[6-9]\d{9}$/;

        if (!cleanName || cleanName.length > 100) {
            return res.status(400).json({
                message: "Enter a valid admin name."
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
            [cleanEmail, adminId]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                message: "This email address is already in use."
            });
        }

        const [result] = await pool.execute<ResultSetHeader>(
            `UPDATE users
             SET name = ?, email = ?, phone = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND role = 'admin'`,
            [cleanName, cleanEmail, cleanPhone || null, adminId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Admin account not found."
            });
        }

        return res.status(200).json({
            message: "Admin profile updated successfully.",
            profile: {
                id: adminId,
                name: cleanName,
                email: cleanEmail,
                phone: cleanPhone || null
            }
        });

    } catch (error) {
        console.error("Update admin profile error:", error);

        return res.status(500).json({
            message: "Unable to update admin profile."
        });
    }
};


// CHANGE ADMIN PASSWORD
export const changeAdminPassword = async (
    req: Request,
    res: Response
) => {
    try {
        const adminId = (req as any).user.id;
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                message: "All password fields are required."
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                message: "New password and confirm password do not match."
            });
        }

        const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;

        if (!passwordPattern.test(newPassword)) {
            return res.status(400).json({
                message: "Password must contain at least 6 characters, including a letter and a number."
            });
        }

        const [users] = await pool.query<RowDataPacket[]>(
            `SELECT password
             FROM users
             WHERE id = ? AND role = 'admin' AND is_active = 1`,
            [adminId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "Admin account not found."
            });
        }

        const isPasswordValid = await bcrypt.compare(
            currentPassword,
            users[0].password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Current password is incorrect."
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await pool.execute(
            `UPDATE users
             SET password = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND role = 'admin'`,
            [hashedPassword, adminId]
        );

        return res.status(200).json({
            message: "Admin password changed successfully."
        });

    } catch (error) {
        console.error("Change admin password error:", error);

        return res.status(500).json({
            message: "Unable to change admin password."
        });
    }
};
