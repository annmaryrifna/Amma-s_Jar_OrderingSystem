import { Request, Response } from "express";
import pool from "../config/db.js";
import { ResultSetHeader, RowDataPacket } from "mysql2";

const getLatestSettings = async () => {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT setting_id, pickup_location, max_delivery_distance,
                delivery_enabled, updated_at
         FROM delivery_settings
         ORDER BY setting_id DESC
         LIMIT 1`
    );
    return rows[0] || null;
};

// Get general delivery settings and all delivery localities for the admin page.
export const getDeliveryManagementData = async (_req: Request, res: Response) => {
    try {
        const [settings, areas] = await Promise.all([
            getLatestSettings(),
            pool.query<RowDataPacket[]>(
                `SELECT area_id, area_name, pincode, delivery_charge,
                        is_active, created_at, updated_at
                 FROM delivery_areas
                 ORDER BY area_name ASC`
            ),
        ]);

        if (!settings) {
            return res.status(404).json({
                message: "Delivery settings were not found. Please configure them in the database.",
            });
        }

        return res.status(200).json({
            settings,
            areas: areas[0],
        });
    } catch (error) {
        console.error("Get delivery management data error:", error);
        return res.status(500).json({ message: "Unable to load delivery management data." });
    }
};

// Add a new locality.
export const addDeliveryArea = async (req: Request, res: Response) => {
    try {
        const { area_name, pincode, delivery_charge, is_active = true } = req.body;
        const name = typeof area_name === "string" ? area_name.trim() : "";
        const pin = String(pincode ?? "").trim();
        const charge = Number(delivery_charge);

        if (!name || name.length > 150) {
            return res.status(400).json({ message: "Enter a locality name (maximum 150 characters)." });
        }
        if (!/^\d{6}$/.test(pin)) {
            return res.status(400).json({ message: "Enter a valid 6-digit PIN code." });
        }
        if (!Number.isFinite(charge) || charge < 0 || charge > 100000) {
            return res.status(400).json({ message: "Enter a valid non-negative delivery charge." });
        }
        if (typeof is_active !== "boolean") {
            return res.status(400).json({ message: "Invalid locality status." });
        }

        const [result] = await pool.execute<ResultSetHeader>(
            `INSERT INTO delivery_areas (area_name, pincode, delivery_charge, is_active)
             VALUES (?, ?, ?, ?)`,
            [name, pin, charge, is_active]
        );

        return res.status(201).json({
            message: "Delivery locality added successfully.",
            area_id: result.insertId,
        });
    } catch (error: any) {
        if (error?.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ message: "This locality and PIN code combination already exists." });
        }
        console.error("Add delivery area error:", error);
        return res.status(500).json({ message: "Unable to add delivery locality." });
    }
};

// Edit locality name, PIN code, and delivery charge.
export const updateDeliveryArea = async (req: Request, res: Response) => {
    try {
        const areaId = Number(req.params.areaId);
        const { area_name, pincode, delivery_charge } = req.body;
        const name = typeof area_name === "string" ? area_name.trim() : "";
        const pin = String(pincode ?? "").trim();
        const charge = Number(delivery_charge);

        if (!Number.isInteger(areaId) || areaId <= 0) {
            return res.status(400).json({ message: "Invalid locality ID." });
        }
        if (!name || name.length > 150) {
            return res.status(400).json({ message: "Enter a locality name (maximum 150 characters)." });
        }
        if (!/^\d{6}$/.test(pin)) {
            return res.status(400).json({ message: "Enter a valid 6-digit PIN code." });
        }
        if (!Number.isFinite(charge) || charge < 0 || charge > 100000) {
            return res.status(400).json({ message: "Enter a valid non-negative delivery charge." });
        }

        const [result] = await pool.execute<ResultSetHeader>(
            `UPDATE delivery_areas
             SET area_name = ?, pincode = ?, delivery_charge = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE area_id = ?`,
            [name, pin, charge, areaId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Delivery locality not found." });
        }

        return res.status(200).json({ message: "Delivery locality updated successfully." });
    } catch (error: any) {
        if (error?.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ message: "This locality and PIN code combination already exists." });
        }
        console.error("Update delivery area error:", error);
        return res.status(500).json({ message: "Unable to update delivery locality." });
    }
};

// Activate or deactivate a locality.
export const updateDeliveryAreaStatus = async (req: Request, res: Response) => {
    try {
        const areaId = Number(req.params.areaId);
        const { is_active } = req.body;

        if (!Number.isInteger(areaId) || areaId <= 0) {
            return res.status(400).json({ message: "Invalid locality ID." });
        }
        if (typeof is_active !== "boolean") {
            return res.status(400).json({ message: "Status must be true or false." });
        }

        const [result] = await pool.execute<ResultSetHeader>(
            `UPDATE delivery_areas
             SET is_active = ?, updated_at = CURRENT_TIMESTAMP
             WHERE area_id = ?`,
            [is_active, areaId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Delivery locality not found." });
        }

        return res.status(200).json({
            message: is_active ? "Locality activated successfully." : "Locality deactivated successfully.",
        });
    } catch (error) {
        console.error("Update delivery area status error:", error);
        return res.status(500).json({ message: "Unable to update locality status." });
    }
};

// Update the general delivery configuration.
export const updateDeliverySettings = async (req: Request, res: Response) => {
    try {
        const { pickup_location, max_delivery_distance, delivery_enabled } = req.body;
        const location = typeof pickup_location === "string" ? pickup_location.trim() : "";
        const maxDistance = Number(max_delivery_distance);

        if (!location || location.length > 255) {
            return res.status(400).json({ message: "Enter a pickup location (maximum 255 characters)." });
        }
        if (!Number.isFinite(maxDistance) || maxDistance <= 0 || maxDistance > 100) {
            return res.status(400).json({ message: "Maximum delivery distance must be between 0 and 100 km." });
        }
        if (typeof delivery_enabled !== "boolean") {
            return res.status(400).json({ message: "Delivery enabled must be true or false." });
        }

        const settings = await getLatestSettings();
        if (!settings) {
            return res.status(404).json({ message: "Delivery settings were not found." });
        }

        await pool.execute(
            `UPDATE delivery_settings
             SET pickup_location = ?, max_delivery_distance = ?, delivery_enabled = ?
             WHERE setting_id = ?`,
            [location, maxDistance, delivery_enabled, settings.setting_id]
        );

        return res.status(200).json({ message: "General delivery settings updated successfully." });
    } catch (error) {
        console.error("Update delivery settings error:", error);
        return res.status(500).json({ message: "Unable to update delivery settings." });
    }
};
