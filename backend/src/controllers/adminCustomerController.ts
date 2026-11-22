
import { Request, Response } from "express";
import pool from "../config/db.js";
import { RowDataPacket } from "mysql2";

export const getAllCustomers = async (
    req: Request,
    res: Response
) => {
    try {
        const [customers] = await pool.query<RowDataPacket[]>(
            `SELECT
                id,
                name,
                email,
                phone,
                is_active,
                created_at
             FROM users
             WHERE role = 'customer'
             ORDER BY created_at DESC`
        );

        return res.status(200).json({
            message: "Registered customers retrieved successfully.",
            totalCustomers: customers.length,
            customers
        });

    } catch (error) {
        console.error("Get customers error:", error);

        return res.status(500).json({
            message: "Unable to retrieve registered customers."
        });
    }
};
