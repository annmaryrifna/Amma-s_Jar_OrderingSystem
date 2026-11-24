
import express from "express";
import {
    addCategory,
    getCategories,
    getAllAdminCategories,
    updateCategory,
    updateCategoryStatus,
    deleteCategory
} from "../controllers/categoryController.js";

import upload from "../config/upload.js";
import verifyToken from "../middleware/authMiddleware.js";
import verifyAdmin from "../middleware/adminMiddleware.js";

const router = express.Router();
router.get(
    "/admin/all",
    verifyToken,
    verifyAdmin,
    getAllAdminCategories
);
// Public: Customers and visitors can view categories
router.get("/", getCategories);

// Admin only: Add category
router.post(
    "/",
    verifyToken,
    verifyAdmin,
    upload.single("image"),
    addCategory
);

// Admin only: Edit category
router.put(
    "/:categoryId",
    verifyToken,
    verifyAdmin,
    upload.single("image"),
    updateCategory
);

// Admin only: Activate / Deactivate category
router.patch(
    "/:categoryId/status",
    verifyToken,
    verifyAdmin,
    updateCategoryStatus
);

// Admin only: Remove category
router.delete(
    "/:categoryId",
    verifyToken,
    verifyAdmin,
    deleteCategory
);

export default router;
