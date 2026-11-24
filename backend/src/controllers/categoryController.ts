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
    WHERE is_active = 1
    AND (
        parent_category_id IS NULL
        OR parent_category_id IN (
            SELECT category_id
            FROM categories
            WHERE is_active = 1
        )
    )
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
export const getAllAdminCategories = async (
    req: Request,
    res: Response
) => {
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
            ORDER BY
                CASE WHEN parent_category_id IS NULL THEN 0 ELSE 1 END,
                parent_category_id ASC,
                category_id DESC`
        );

        return res.status(200).json({ categories });

    } catch (error) {
        console.error("Get admin categories error:", error);

        return res.status(500).json({
            message: "Unable to fetch categories."
        });
    }
};
export const updateCategory = async (req: Request, res: Response) => {
    try {
        const categoryId = Number(req.params.categoryId);
        const { category_name, parent_category_id, description } = req.body;

        if (!Number.isInteger(categoryId) || categoryId <= 0) {
            return res.status(400).json({ message: "Invalid category ID." });
        }

        if (!category_name || !category_name.trim()) {
            return res.status(400).json({ message: "Category name is required." });
        }

        const [existing]: any = await db.query(
            "SELECT category_id, image FROM categories WHERE category_id = ?",
            [categoryId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: "Category not found." });
        }

        const parentId = parent_category_id ? Number(parent_category_id) : null;

        if (parentId !== null) {
            if (!Number.isInteger(parentId) || parentId <= 0 || parentId === categoryId) {
                return res.status(400).json({ message: "Invalid parent category." });
            }

            const [parent]: any = await db.query(
                `SELECT category_id FROM categories
                 WHERE category_id = ? AND parent_category_id IS NULL`,
                [parentId]
            );

            if (parent.length === 0) {
                return res.status(400).json({
                    message: "Please select a valid main category."
                });
            }
        }

        const image = req.file
            ? `/uploads/categories/${req.file.filename}`
            : existing[0].image;

        await db.query(
            `UPDATE categories
             SET category_name = ?,
                 parent_category_id = ?,
                 description = ?,
                 image = ?
             WHERE category_id = ?`,
            [
                category_name.trim(),
                parentId,
                description || null,
                image,
                categoryId
            ]
        );

        return res.status(200).json({
            message: "Category updated successfully."
        });

    } catch (error) {
        console.error("Update category error:", error);
        return res.status(500).json({ message: "Unable to update category." });
    }
};

export const updateCategoryStatus = async (req: Request, res: Response) => {
    try {
        const categoryId = Number(req.params.categoryId);
        const { is_active } = req.body;

        if (!Number.isInteger(categoryId) || categoryId <= 0) {
            return res.status(400).json({ message: "Invalid category ID." });
        }

        if (typeof is_active !== "boolean" && ![0, 1].includes(is_active)) {
            return res.status(400).json({ message: "Invalid category status." });
        }

        const [result]: any = await db.query(
            "UPDATE categories SET is_active = ? WHERE category_id = ?",
            [is_active ? 1 : 0, categoryId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Category not found." });
        }

        return res.status(200).json({
            message: `Category ${is_active ? "activated" : "deactivated"} successfully.`
        });

    } catch (error) {
        console.error("Update category status error:", error);
        return res.status(500).json({ message: "Unable to update category status." });
    }
};

export const deleteCategory = async (req: Request, res: Response) => {
    try {
        const categoryId = Number(req.params.categoryId);

        if (!Number.isInteger(categoryId) || categoryId <= 0) {
            return res.status(400).json({ message: "Invalid category ID." });
        }

        const [existing]: any = await db.query(
            "SELECT category_id FROM categories WHERE category_id = ?",
            [categoryId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: "Category not found." });
        }

        const [subcategories]: any = await db.query(
            "SELECT COUNT(*) AS total FROM categories WHERE parent_category_id = ?",
            [categoryId]
        );

        if (Number(subcategories[0].total) > 0) {
            return res.status(400).json({
                message: "Remove or reassign the subcategories before removing this category."
            });
        }

        const [products]: any = await db.query(
            "SELECT COUNT(*) AS total FROM products WHERE category_id = ?",
            [categoryId]
        );

        if (Number(products[0].total) > 0) {
            return res.status(400).json({
                message: "This category contains products. Reassign or remove those products first."
            });
        }

        await db.query(
            "DELETE FROM categories WHERE category_id = ?",
            [categoryId]
        );

        return res.status(200).json({
            message: "Category removed successfully."
        });

    } catch (error) {
        console.error("Delete category error:", error);
        return res.status(500).json({ message: "Unable to remove category." });
    }
};