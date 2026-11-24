import { Request, Response } from "express";
import db from "../config/db.js";

export const addProduct = async (req: Request, res: Response) => {
    try {
        const {
            product_name,
            category_id,
            description,
            price,
            price_quantity,
            unit,
            purchase_options
        } = req.body;

        // Validate required fields
        if (
            !product_name?.trim() ||
            !category_id ||
            !price ||
            !price_quantity ||
            !unit
        ) {
            return res.status(400).json({
                message: "Please provide all required product details"
            });
        }

        // Check whether the selected category is a subcategory
        const [categoryRows]: any = await db.query(
            `SELECT category_id, parent_category_id
             FROM categories
             WHERE category_id = ? AND is_active = TRUE`,
            [category_id]
        );

        if (
            categoryRows.length === 0 ||
            categoryRows[0].parent_category_id === null
        ) {
            return res.status(400).json({
                message: "Please select a valid subcategory"
            });
        }

        const image = req.file
            ? `/uploads/products/${req.file.filename}`
            : null;

        const options = purchase_options
            ? JSON.stringify(
                typeof purchase_options === "string"
                    ? JSON.parse(purchase_options)
                    : purchase_options
            )
            : null;

        const [result]: any = await db.query(
            `INSERT INTO products (
                product_name,
                category_id,
                description,
                image,
                price,
                price_quantity,
                unit,
                purchase_options
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                product_name.trim(),
                category_id,
                description || null,
                image,
                price,
                price_quantity,
                unit,
                options            ]
        );

        res.status(201).json({
            message: "Product added successfully",
            product_id: result.insertId,
            image
        });

    } catch (error) {
        console.error("Add product error:", error);

        res.status(500).json({
            message: "Unable to add product"
        });
    }
};

export const getProducts = async (req: Request, res: Response) => {
    try {
        const [products] = await db.query(
            `SELECT
                p.product_id,
                p.product_name,
                p.category_id,
                c.category_name AS subcategory_name,
                parent.category_name AS main_category_name,
                p.description,
                p.image,
                p.price,
                p.price_quantity,
                p.unit,
                p.purchase_options,
                p.is_active,
                p.created_at
            FROM products p
            INNER JOIN categories c
                ON p.category_id = c.category_id
            INNER JOIN categories parent
                ON c.parent_category_id = parent.category_id
            WHERE p.is_active = 1
              AND c.is_active = 1
              AND parent.is_active = 1
            ORDER BY
                parent.category_name ASC,
                c.category_name ASC,
                p.product_name ASC`
        );

        return res.status(200).json({ products });

    } catch (error) {
        console.error("Get products error:", error);

        return res.status(500).json({
            message: "Unable to fetch products."
        });
    }
};
export const getAllAdminProducts = async (
    req: Request,
    res: Response
) => {
    try {
        const [products] = await db.query(
            `SELECT
                p.product_id,
                p.product_name,
                p.category_id,
                c.category_name AS subcategory_name,
                parent.category_name AS main_category_name,
                p.description,
                p.image,
                p.price,
                p.price_quantity,
                p.unit,
                p.purchase_options,
                p.is_active,
                p.created_at
            FROM products p
            INNER JOIN categories c
                ON p.category_id = c.category_id
            LEFT JOIN categories parent
                ON c.parent_category_id = parent.category_id
            ORDER BY
                parent.category_name ASC,
                c.category_name ASC,
                p.product_name ASC`
        );

        return res.status(200).json({ products });

    } catch (error) {
        console.error("Get admin products error:", error);

        return res.status(500).json({
            message: "Unable to fetch products."
        });
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    try {
        const productId = Number(req.params.productId);

        const {
            product_name,
            category_id,
            description,
            price,
            price_quantity,
            unit,
            purchase_options
        } = req.body;

        if (!Number.isInteger(productId) || productId <= 0) {
            return res.status(400).json({
                message: "Invalid product ID."
            });
        }

        if (
            !product_name?.trim() ||
            !category_id ||
            !price ||
            !price_quantity ||
            !unit
        ) {
            return res.status(400).json({
                message: "Please provide all required product details."
            });
        }

        // Check whether the product exists
        const [existingProducts]: any = await db.query(
            `SELECT product_id, image
             FROM products
             WHERE product_id = ?`,
            [productId]
        );

        if (existingProducts.length === 0) {
            return res.status(404).json({
                message: "Product not found."
            });
        }

        // Validate selected subcategory
        const [categoryRows]: any = await db.query(
            `SELECT c.category_id
             FROM categories c
             INNER JOIN categories parent
                ON c.parent_category_id = parent.category_id
             WHERE c.category_id = ?
               AND c.is_active = 1
               AND parent.is_active = 1`,
            [category_id]
        );

        if (categoryRows.length === 0) {
            return res.status(400).json({
                message: "Please select an active subcategory."
            });
        }

        // Keep existing image if no new image is uploaded
        const image = req.file
            ? `/uploads/products/${req.file.filename}`
            : existingProducts[0].image;

        const options = purchase_options
            ? JSON.stringify(
                typeof purchase_options === "string"
                    ? JSON.parse(purchase_options)
                    : purchase_options
            )
            : null;

        await db.query(
            `UPDATE products
             SET product_name = ?,
                 category_id = ?,
                 description = ?,
                 image = ?,
                 price = ?,
                 price_quantity = ?,
                 unit = ?,
                 purchase_options = ?
             WHERE product_id = ?`,
            [
                product_name.trim(),
                category_id,
                description || null,
                image,
                price,
                price_quantity,
                unit,
                options,
                productId
            ]
        );

        return res.status(200).json({
            message: "Product updated successfully."
        });

    } catch (error) {
        console.error("Update product error:", error);

        return res.status(500).json({
            message: "Unable to update product."
        });
    }
};

export const updateProductStatus = async (
    req: Request,
    res: Response
) => {
    try {
        const productId = Number(req.params.productId);
        const { is_active } = req.body;

        if (!Number.isInteger(productId) || productId <= 0) {
            return res.status(400).json({
                message: "Invalid product ID."
            });
        }

        if (typeof is_active !== "boolean" && ![0, 1].includes(is_active)) {
            return res.status(400).json({
                message: "Invalid product status."
            });
        }

        const [result]: any = await db.query(
            `UPDATE products
             SET is_active = ?
             WHERE product_id = ?`,
            [is_active ? 1 : 0, productId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Product not found."
            });
        }

        return res.status(200).json({
            message: `Product ${is_active ? "activated" : "deactivated"} successfully.`
        });

    } catch (error) {
        console.error("Update product status error:", error);

        return res.status(500).json({
            message: "Unable to update product status."
        });
    }
};