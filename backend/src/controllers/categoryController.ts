import { Request, Response } from "express";
import db from "../config/db.js";

export const addCategory = async (req: Request, res: Response) => {
    try {
        const { category_name, parent_category_id, description } = req.body;

        if (!category_name || !category_name.trim()) {
            return res.status(400).json({
                message: "Category name is required"
            });
        }

        const image = req.file
            ? `/uploads/categories/${req.file.filename}`
            : null;

        const [result]: any = await db.query(
            `INSERT INTO categories
            (category_name, parent_category_id, description, image)
            VALUES (?, ?, ?, ?)`,
            [
                category_name.trim(),
                parent_category_id || null,
                description || null,
                image
            ]
        );

        res.status(201).json({
            message: "Category added successfully",
            category_id: result.insertId,
            image
        });

    } catch (error) {
        console.error("Add category error:", error);

        res.status(500).json({
            message: "Unable to add category"
        });
    }
};

export const getCategories = async (req: Request, res: Response) => {
    try {
        const [categories] = await db.query(
            `SELECT
                category_id,
                category_name,
                parent_category_id,
                description,
                image,
                is_active,
                created_at
            FROM categories
            ORDER BY category_id DESC`
        );

        res.status(200).json({
            categories
        });

    } catch (error) {
        console.error("Get categories error:", error);

        res.status(500).json({
            message: "Unable to fetch categories"
        });
    }
};