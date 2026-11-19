
import express from "express";
import {
    addCategory,
    getCategories
} from "../controllers/categoryController.js";

import upload from "../config/upload.js";
import verifyToken from "../middleware/authMiddleware.js";
import verifyAdmin from "../middleware/adminMiddleware.js";

const router = express.Router();

// Public: Customers and visitors can view categories
router.get("/", getCategories);

// Admin only: Add categories
router.post(
    "/",
    verifyToken,
    verifyAdmin,
    upload.single("image"),
    addCategory
);

export default router;
