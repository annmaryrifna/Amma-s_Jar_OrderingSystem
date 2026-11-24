
import express from "express";

import {
    addProduct,
    getProducts,
    getAllAdminProducts,
    updateProduct,
    updateProductStatus
} from "../controllers/productController.js";

import upload from "../config/upload.js";
import verifyToken from "../middleware/authMiddleware.js";
import verifyAdmin from "../middleware/adminMiddleware.js";

const router = express.Router();
router.get(
    "/admin/all",
    verifyToken,
    verifyAdmin,
    getAllAdminProducts
);
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
// Admin only: Edit product
router.put(
    "/:productId",
    verifyToken,
    verifyAdmin,
    upload.single("image"),
    updateProduct
);
// Admin only: Activate / Deactivate product
router.patch(
    "/:productId/status",
    verifyToken,
    verifyAdmin,
    updateProductStatus
);
export default router;
