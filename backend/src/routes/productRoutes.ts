
import express from "express";

import {
    addProduct,
    getProducts
} from "../controllers/productController.js";

import upload from "../config/upload.js";
import verifyToken from "../middleware/authMiddleware.js";
import verifyAdmin from "../middleware/adminMiddleware.js";

const router = express.Router();

// Public: Customers and visitors can view products
router.get("/", getProducts);

// Admin only: Add products
router.post(
    "/",
    verifyToken,
    verifyAdmin,
    upload.single("image"),
    addProduct
);

export default router;
