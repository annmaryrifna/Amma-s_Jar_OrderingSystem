
import { Router } from "express";
import { getAllCustomers } from "../controllers/adminCustomerController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { verifyAdmin } from "../middleware/adminMiddleware.js";
import {
    getCustomerProfile,
    updateCustomerProfile
} from "../controllers/customerAccountController.js";
const router = Router();

// Get all registered customers
router.get(
    "/",
    verifyToken,
    verifyAdmin,
    getAllCustomers
);
// Get customer profile
router.get(
    "/profile",
    verifyToken,
    (req, res, next) => {
        if ((req as any).user.role !== "customer") {
            return res.status(403).json({
                message: "Customer access only."
            });
        }
        next();
    },
    getCustomerProfile
);

// Update customer profile
router.put(
    "/profile",
    verifyToken,
    (req, res, next) => {
        if ((req as any).user.role !== "customer") {
            return res.status(403).json({
                message: "Customer access only."
            });
        }
        next();
    },
    updateCustomerProfile
);
export default router;
