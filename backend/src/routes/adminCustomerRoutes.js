
import { Router } from "express";
import { getAllCustomers } from "../controllers/adminCustomerController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { verifyAdmin } from "../middleware/adminMiddleware.js";

const router = Router();

// Get all registered customers
router.get(
    "/",
    verifyToken,
    verifyAdmin,
    getAllCustomers
);

export default router;
