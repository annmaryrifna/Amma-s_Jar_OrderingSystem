
import { Request, Response } from "express";
import pool from "../config/db.js";
import { RowDataPacket } from "mysql2";

// Get all customer complaints
export const getAllComplaints = async (
    req: Request,
    res: Response
) => {
    try {
        const [complaints] = await pool.query<RowDataPacket[]>(
            `SELECT
                c.complaint_id,
                c.order_id,
                c.user_id,
                c.subject,
                c.category,
                c.complaint_message,
                c.admin_reply,
                c.complaint_status,
                c.created_at,
                c.updated_at,
                u.name AS customer_name,
                u.email AS customer_email,
                u.phone AS customer_phone
            FROM customer_complaints c
            JOIN users u ON c.user_id = u.id
            ORDER BY c.created_at DESC`
        );

        return res.status(200).json({
            message: "Complaints retrieved successfully.",
            complaints,
        });

    } catch (error) {
        console.error("Get complaints error:", error);

        return res.status(500).json({
            message: "Unable to retrieve complaints.",
        });
    }
};

export const updateComplaint = async (
    req: Request,
    res: Response
) => {
    try {
        const complaintId = Number(req.params.complaintId);

        const { adminReply, complaintStatus } = req.body;

        const allowedStatuses = [
            "Pending",
            "In Progress",
            "Resolved",
        ];

        if (!Number.isInteger(complaintId) || complaintId <= 0) {
            return res.status(400).json({
                message: "Invalid complaint ID.",
            });
        }

        if (
            !allowedStatuses.includes(complaintStatus) ||
            typeof adminReply !== "string" ||
            !adminReply.trim()
        ) {
            return res.status(400).json({
                message: "Please provide a valid status and reply.",
            });
        }

        const [result] = await pool.query(
            `UPDATE customer_complaints
             SET admin_reply = ?, complaint_status = ?
             WHERE complaint_id = ?`,
            [
                adminReply.trim(),
                complaintStatus,
                complaintId,
            ]
        );

        if ((result as any).affectedRows === 0) {
            return res.status(404).json({
                message: "Complaint not found.",
            });
        }

        return res.status(200).json({
            message: "Complaint updated successfully.",
        });

    } catch (error) {
        console.error("Update complaint error:", error);

        return res.status(500).json({
            message: "Unable to update complaint.",
        });
    }
};
